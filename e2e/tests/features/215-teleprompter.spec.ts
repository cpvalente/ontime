import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures/override';

/** The heading of the event the reading line is currently over. */
function eventUnderReadingLine(page: Page) {
  return page.evaluate(() => {
    const line = document.querySelector('.teleprompter__reading-line')?.getBoundingClientRect();
    if (!line) throw new Error('Reading line not found');
    const element = document.elementFromPoint(window.innerWidth / 2, line.top + line.height / 2);
    return element?.closest('.teleprompter__block')?.querySelector('.teleprompter__heading')?.textContent ?? null;
  });
}

test('teleprompter renders and responds to its primary controls', async ({ page, request }) => {
  // Earlier feature specs edit the loaded rundown. Restore the real demo project
  // instead of manufacturing test-only events: its notes are the script fixture.
  const response = await request.post('/data/db/demo');
  expect(response.ok()).toBe(true);
  const loadResponse = await request.get('/api/load/index/5');
  expect(loadResponse.ok()).toBe(true);

  await page.goto('/teleprompter?script=note&flipV=true');

  const view = page.getByTestId('teleprompter-view');
  const scroller = page.getByTestId('teleprompter-scroller');
  const speed = page.getByTestId('teleprompter-speed');

  await expect(view).toBeVisible();
  await expect(scroller).toBeVisible();
  await expect(page.getByText('Music plays, holding slide on screens')).toBeVisible();
  await expect(speed).toContainText('14');
  await expect(view).toHaveCSS('transform', /^matrix\(1, 0, 0, -1/);

  // Following uses layout coordinates, which must remain stable when the view's
  // visual coordinates are inverted by a vertical transform.
  const loadedBlock = page.locator('.teleprompter__block[data-loaded]');
  await expect(loadedBlock).toBeAttached();
  const expectedScrollTop = await loadedBlock.evaluate((element) => {
    const scroller = element.closest('.teleprompter')?.querySelector<HTMLElement>('.teleprompter__scroller');
    if (!scroller) throw new Error('Teleprompter scroller not found');
    return Math.max(0, (element as HTMLElement).offsetTop - scroller.clientHeight * 0.25);
  });
  await expect
    .poll(async () => Math.abs((await scroller.evaluate((element) => element.scrollTop)) - expectedScrollTop))
    .toBeLessThan(2);

  await page.goto('/teleprompter?script=note');

  await page.keyboard.press('Space');
  await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('Space');

  await page.keyboard.press('ArrowRight');
  await expect(speed).toContainText('15');
});

test('the script wraps the same way on screens of different sizes', async ({ page, request }) => {
  const response = await request.post('/data/db/demo');
  expect(response.ok()).toBe(true);

  // lines each event takes, which is what lines per minute is measured in
  const linesPerEvent = async () => {
    await expect(page.locator('.teleprompter__body').first()).toBeVisible();
    return page
      .locator('.teleprompter__body')
      .evaluateAll((bodies) =>
        bodies.map((body) => Math.round(body.clientHeight / Number.parseFloat(getComputedStyle(body).lineHeight))),
      );
  };

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/teleprompter?script=note');
  const onDesktop = await linesPerEvent();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const onPhone = await linesPerEvent();

  expect(onDesktop.some((lines) => lines > 1)).toBe(true);
  expect(onPhone).toEqual(onDesktop);
});

test('an edit above the reader leaves the same text under the reading line', async ({ page, request }) => {
  const response = await request.post('/data/db/demo');
  expect(response.ok()).toBe(true);
  const loadResponse = await request.get('/api/load/index/5');
  expect(loadResponse.ok()).toBe(true);

  // following moves the reader for its own reasons; this is about the document
  // changing underneath a position the reader chose
  await page.goto('/teleprompter?script=note&followLoaded=false');

  const scroller = page.getByTestId('teleprompter-scroller');
  await expect(scroller).toBeVisible();

  // park the reading line inside a block rather than at a fraction of the
  // document, whose tail is a screen of padding below the last event
  await scroller.evaluate((element) => {
    const blocks = element.querySelectorAll<HTMLElement>('.teleprompter__block');
    const target = blocks[Math.floor(blocks.length / 2)];
    element.scrollTop = target.offsetTop + 10 - element.clientHeight * 0.25;
  });
  const before = await eventUnderReadingLine(page);
  expect(before).not.toBeNull();
  const scrollBefore = await scroller.evaluate((element) => element.scrollTop);

  // grow the first event's script, which sits above wherever we scrolled to
  const edit = await request.put('/data/rundowns/default/entry', {
    data: { id: '9bf60f', note: `Music plays, holding slide on screens\n${'Another line of script. '.repeat(120)}` },
  });
  expect(edit.ok()).toBe(true);

  // the document grew, so holding position means the offset had to change
  await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(scrollBefore);
  expect(await eventUnderReadingLine(page)).toBe(before);
});

test('shift and the vertical arrows walk the reader event by event', async ({ page, request }) => {
  const response = await request.post('/data/db/demo');
  expect(response.ok()).toBe(true);
  const loadResponse = await request.get('/api/load/index/5');
  expect(loadResponse.ok()).toBe(true);

  await page.goto('/teleprompter?script=note&followLoaded=false');

  const scroller = page.getByTestId('teleprompter-scroller');
  await expect(scroller).toBeVisible();

  const headings = await page.locator('.teleprompter__heading').allTextContents();
  expect(headings.length).toBeGreaterThan(2);
  await expect.poll(() => eventUnderReadingLine(page)).toBe(headings[0]);

  await page.keyboard.press('Shift+ArrowDown');
  await expect.poll(() => eventUnderReadingLine(page)).toBe(headings[1]);

  await page.keyboard.press('Shift+ArrowDown');
  await expect.poll(() => eventUnderReadingLine(page)).toBe(headings[2]);

  await page.keyboard.press('Shift+ArrowUp');
  await expect.poll(() => eventUnderReadingLine(page)).toBe(headings[1]);
});

/** Parks the reading line just short of the first event's end, so the run to the boundary takes a moment */
function parkBeforeFirstSegmentEnd(page: Page) {
  return page.getByTestId('teleprompter-scroller').evaluate((element) => {
    const block = element.querySelector<HTMLElement>('.teleprompter__block');
    if (!block) throw new Error('No script block found');
    const end = block.offsetTop + block.offsetHeight - element.clientHeight * 0.25;
    element.scrollTop = end - 30;
    return end;
  });
}

test('while following, playback stops at the end of the event instead of reading on', async ({ page, request }) => {
  const response = await request.post('/data/db/demo');
  expect(response.ok()).toBe(true);
  const loadResponse = await request.get('/api/load/index/5');
  expect(loadResponse.ok()).toBe(true);

  await page.goto('/teleprompter?script=note&speed=40');

  const scroller = page.getByTestId('teleprompter-scroller');
  await expect(scroller).toBeVisible();
  // let following settle on the loaded event, so it does not move the reader after we park them
  await expect(page.locator('.teleprompter__block[data-loaded]')).toBeAttached();
  await expect.poll(() => eventUnderReadingLine(page)).not.toBeNull();

  const segmentEnd = await parkBeforeFirstSegmentEnd(page);

  await page.keyboard.press('Space');

  await expect(page.getByTestId('teleprompter-parked')).toBeVisible();
  await expect
    .poll(async () => Math.abs((await scroller.evaluate((element) => element.scrollTop)) - segmentEnd))
    .toBeLessThan(3);

  // and it stays there, rather than carrying on after a beat
  await page.waitForTimeout(500);
  expect(Math.abs((await scroller.evaluate((element) => element.scrollTop)) - segmentEnd)).toBeLessThan(3);

  // pressing play again is how the reader moves on to the next event
  await page.keyboard.press('Space');
  await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(segmentEnd + 5);
});

test('scrolling into a later event while playing keeps the reader there', async ({ page, request }) => {
  const response = await request.post('/data/db/demo');
  expect(response.ok()).toBe(true);
  const loadResponse = await request.get('/api/load/index/5');
  expect(loadResponse.ok()).toBe(true);

  await page.goto('/teleprompter?script=note&speed=1');

  const scroller = page.getByTestId('teleprompter-scroller');
  await expect(scroller).toBeVisible();
  const loadedHeading = await page.locator('.teleprompter__block[data-loaded] .teleprompter__heading').textContent();
  await expect.poll(() => eventUnderReadingLine(page)).toBe(loadedHeading);

  // playback is bound to the loaded event, and the reader scrolls on past it
  await page.keyboard.press('Space');
  const laterHeading = await scroller.evaluate((element) => {
    const block = element.querySelector<HTMLElement>('.teleprompter__block[data-loaded] + .teleprompter__block');
    if (!block) throw new Error('No event after the loaded one');
    element.scrollTop = block.offsetTop + 10 - element.clientHeight * 0.25;
    return block.querySelector('.teleprompter__heading')?.textContent ?? null;
  });

  await page.waitForTimeout(500);
  expect(await eventUnderReadingLine(page)).toBe(laterHeading);
  await expect(page.getByTestId('teleprompter-parked')).toHaveCount(0);
  await page.keyboard.press('Space');
});

test('without following, playback reads on across events', async ({ page, request }) => {
  const response = await request.post('/data/db/demo');
  expect(response.ok()).toBe(true);

  await page.goto('/teleprompter?script=note&followLoaded=false&speed=40');

  const scroller = page.getByTestId('teleprompter-scroller');
  await expect(scroller).toBeVisible();
  const segmentEnd = await parkBeforeFirstSegmentEnd(page);

  await page.keyboard.press('Space');
  await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(segmentEnd + 5);
  await expect(page.getByTestId('teleprompter-parked')).toHaveCount(0);
  await page.keyboard.press('Space');
});

test('follow tolerates a small scroll and breaks on a real one, like the operator view', async ({ page, request }) => {
  const response = await request.post('/data/db/demo');
  expect(response.ok()).toBe(true);
  const loadResponse = await request.get('/api/load/index/5');
  expect(loadResponse.ok()).toBe(true);

  await page.goto('/teleprompter?script=note');

  const scroller = page.getByTestId('teleprompter-scroller');
  const follow = page.getByTestId('teleprompter-follow');
  await expect(scroller).toBeVisible();
  await expect(follow).toBeDisabled();

  await page.mouse.move(960, 500);
  await page.mouse.wheel(0, 15);
  await expect(follow).toBeDisabled();

  await page.mouse.wheel(0, 400);
  await expect(follow).toBeEnabled();

  await page.keyboard.press('l');
  await expect(follow).toBeDisabled();
});

test('remote controlled views share playback and speed, and ignore local transport', async ({
  page,
  context,
  request,
}) => {
  const response = await request.post('/data/db/demo');
  expect(response.ok()).toBe(true);
  // the shared state outlives a project load, so start from a known one
  expect((await request.get('/api/teleprompter/pause')).ok()).toBe(true);
  expect((await request.get('/api/teleprompter/speed/14')).ok()).toBe(true);
  expect((await request.get('/api/load/index/1')).ok()).toBe(true);

  const remoteUrl = '/teleprompter?script=note&remoteControl=true';
  await page.goto(remoteUrl);
  const monitor = await context.newPage();
  await monitor.goto(remoteUrl);
  const local = await context.newPage();
  await local.goto('/teleprompter?script=note');

  for (const view of [page, monitor]) {
    await expect(view.getByTestId('teleprompter-remote')).toHaveText('Remote · Paused');
  }

  // local transport does nothing under remote control
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('teleprompter-remote')).toHaveText('Remote · Paused');
  await expect(page.getByTestId('teleprompter-speed')).toHaveText('14lpm');

  expect((await request.get('/api/teleprompter/speed/30')).ok()).toBe(true);
  expect((await request.get('/api/teleprompter/play')).ok()).toBe(true);
  for (const view of [page, monitor]) {
    await expect(view.getByTestId('teleprompter-speed')).toHaveText('30lpm');
    await expect(view.getByTestId('teleprompter-remote')).toHaveText('Remote · Playing');
  }

  // an uncontrolled view keeps to its own controls
  await expect(local.getByTestId('teleprompter-play')).toHaveAccessibleName('Play');
  await expect(local.getByTestId('teleprompter-speed')).toHaveText('14lpm');

  // a view which joins late converges on the shared state
  const lateJoiner = await context.newPage();
  await lateJoiner.goto(remoteUrl);
  await expect(lateJoiner.getByTestId('teleprompter-remote')).toHaveText('Remote · Playing');

  // loading a later event while playing moves the reader there, and playback carries on from it
  const loaded = page.locator('[data-loaded] .teleprompter__heading');
  const previousHeading = await loaded.textContent();
  expect((await request.get('/api/load/index/5')).ok()).toBe(true);
  await expect(loaded).not.toHaveText(previousHeading ?? '');
  const loadedHeading = await loaded.textContent();
  await expect.poll(() => eventUnderReadingLine(page)).toBe(loadedHeading);
  await page.waitForTimeout(500);
  expect(await eventUnderReadingLine(page)).toBe(loadedHeading);

  expect((await request.get('/api/teleprompter/pause')).ok()).toBe(true);
  await expect(monitor.getByTestId('teleprompter-remote')).toHaveText('Remote · Paused');
  expect((await request.get('/api/teleprompter/speed/14')).ok()).toBe(true);
});
