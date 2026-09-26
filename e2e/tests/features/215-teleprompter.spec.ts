import { expect, type Page, test } from '@playwright/test';

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
  await page.keyboard.press('f');
  await expect(speed).toContainText('15');
  await expect(page).toHaveURL(/speed=15/);
  await expect(page).toHaveURL(/flipH=true/);
  await expect(view).toHaveCSS('transform', /^matrix\(-1/);
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

test('playback stops at the end of the event instead of reading on into the next', async ({ page, request }) => {
  const response = await request.post('/data/db/demo');
  expect(response.ok()).toBe(true);
  const loadResponse = await request.get('/api/load/index/5');
  expect(loadResponse.ok()).toBe(true);

  await page.goto('/teleprompter?script=note&followLoaded=false&speed=40');

  const scroller = page.getByTestId('teleprompter-scroller');
  await expect(scroller).toBeVisible();

  // park the reading line just short of the first event's end, so the run to
  // the boundary takes a moment rather than the length of the segment
  const segmentEnd = await scroller.evaluate((element) => {
    const block = element.querySelector<HTMLElement>('.teleprompter__block');
    if (!block) throw new Error('No script block found');
    const end = block.offsetTop + block.offsetHeight - element.clientHeight * 0.25;
    element.scrollTop = end - 30;
    return end;
  });

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

test('onlyPlaying narrows the script to the event being played', async ({ page, request }) => {
  const response = await request.post('/data/db/demo');
  expect(response.ok()).toBe(true);
  const loadResponse = await request.get('/api/load/index/5');
  expect(loadResponse.ok()).toBe(true);

  await page.goto('/teleprompter?script=note');
  await expect(page.locator('.teleprompter__block').first()).toBeVisible();
  const whole = await page.locator('.teleprompter__block').count();
  expect(whole).toBeGreaterThan(1);

  await page.goto('/teleprompter?script=note&onlyPlaying=true');

  const blocks = page.locator('.teleprompter__block');
  await expect(blocks).toHaveCount(1);
  await expect(blocks.first()).toHaveAttribute('data-loaded', 'true');
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
