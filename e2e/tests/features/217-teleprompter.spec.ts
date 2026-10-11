import type { APIRequestContext, Page } from '@playwright/test';

import { expect, test } from '../fixtures/override';

const remoteUrl = '/teleprompter?role=remote';

/** Restores the demo project and a paused transport at the top, event by event, which the transport outlives */
async function resetTeleprompter(request: APIRequestContext) {
  expect((await request.post('/data/db/demo')).ok()).toBe(true);
  for (const command of ['pause', 'speed/14', 'mode/event', 'top']) {
    expect((await request.get(`/api/teleprompter/${command}`)).ok()).toBe(true);
  }
}

/** The row at the reading line, as a fraction between rows */
function readingRow(page: Page) {
  return page.getByTestId('teleprompter-scroller').evaluate((scroller) => {
    const row = scroller.querySelector('.teleprompter__row');
    if (!row) throw new Error('No rows rendered');
    return scroller.scrollTop / Number.parseFloat(getComputedStyle(row).height);
  });
}

function rowTexts(page: Page) {
  return page.locator('.teleprompter__row').allTextContents();
}

test.beforeEach(async ({ request }) => {
  await resetTeleprompter(request);
});

test.afterEach(async ({ request }) => {
  await resetTeleprompter(request);
});

test('a remote screen shows the shared script and answers only to ?', async ({ page, request }) => {
  await page.goto(remoteUrl);
  await expect(page.getByText('Music plays, holding slide on', { exact: true })).toBeVisible();
  await expect(page.getByTestId('teleprompter-state')).toHaveAttribute('aria-label', 'Paused');
  const before = await readingRow(page);

  for (const key of ['Space', 'ArrowDown', 'ArrowRight', 'PageDown', 'Shift+ArrowDown']) {
    await page.keyboard.press(key);
  }
  await expect(page.getByTestId('teleprompter-state')).toHaveAttribute('aria-label', 'Paused');
  await expect(page.getByTestId('teleprompter-speed')).toHaveText('14lpm');
  expect(await readingRow(page)).toBe(before);
  expect((await (await request.get('/api/poll')).json()).payload.teleprompter.playback).toBe('pause');

  // the navigation menu leaves Space to the view
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.keyboard.press('?');
  await expect(page.getByTestId('teleprompter-help')).toBeVisible();
});

test('a screen which connects late, or reloads, lands on the line the others show', async ({
  page,
  context,
  request,
}) => {
  await page.goto(remoteUrl);
  await expect(page.locator('.teleprompter__row').first()).toBeAttached();

  await request.get('/api/teleprompter/speed/20');
  await request.get('/api/teleprompter/play');
  await page.waitForTimeout(1500);

  const late = await context.newPage();
  await late.goto(remoteUrl);
  await expect(late.locator('.teleprompter__row').first()).toBeAttached();
  await expect(late.getByTestId('teleprompter-state')).toHaveAttribute('aria-label', 'Playing');

  // both move with the shared clock
  await expect
    .poll(async () => {
      const [first, second] = await Promise.all([readingRow(page), readingRow(late)]);
      return Math.abs(first - second);
    })
    .toBeLessThan(0.05);

  // a screen which had to reboot rejoins on the same line
  await late.reload();
  await expect(late.locator('.teleprompter__row').first()).toBeAttached();
  await expect
    .poll(async () => {
      const [first, second] = await Promise.all([readingRow(page), readingRow(late)]);
      return Math.abs(first - second);
    })
    .toBeLessThan(0.05);

  await request.get('/api/teleprompter/pause');
  await expect.poll(async () => Math.abs((await readingRow(page)) - (await readingRow(late)))).toBeLessThan(0.001);
});

test('every screen shows the same lines, each sized to fit the text width', async ({ page }) => {
  const linesOn = async (width: number, height: number) => {
    await page.setViewportSize({ width, height });
    await page.goto(remoteUrl);
    await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();
    const fit = await page.locator('.teleprompter__content').evaluate((content) => {
      const rows = [...content.querySelectorAll<HTMLElement>('.teleprompter__row--text')];
      return {
        overflowing: rows.filter((row) => row.scrollWidth > row.clientWidth + 1).length,
        widest: Math.max(...rows.map((row) => row.scrollWidth)) / content.clientWidth,
      };
    });
    expect(fit.overflowing).toBe(0);
    expect(fit.widest).toBeGreaterThan(0.85);
    return rowTexts(page);
  };

  const onDesktop = await linesOn(1920, 1080);
  const onPhone = await linesOn(390, 844);
  expect(onPhone).toEqual(onDesktop);
});

test('a controller drives every remote screen with its keys, wheel and buttons', async ({ page, context, request }) => {
  const transport = async () => (await (await request.get('/api/poll')).json()).payload.teleprompter;

  await page.goto('/teleprompter?role=controller');
  const remote = await context.newPage();
  await remote.goto(remoteUrl);
  await expect(remote.locator('.teleprompter__row--text').first()).toBeVisible();
  await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();

  await page.keyboard.press('ArrowRight');
  await expect(remote.getByTestId('teleprompter-speed')).toHaveText('15lpm');
  await page.getByTestId('teleprompter-faster').click();
  await expect(remote.getByTestId('teleprompter-speed')).toHaveText('16lpm');

  const top = await readingRow(remote);
  await page.keyboard.press('Shift+ArrowDown');
  await expect.poll(() => readingRow(remote)).toBeGreaterThan(top);
  const secondEvent = (await transport()).event?.id;
  await page.getByTestId('teleprompter-next').click();
  await expect.poll(async () => (await transport()).event?.id).not.toBe(secondEvent);
  await page.getByTestId('teleprompter-previous').click();
  await expect.poll(async () => (await transport()).event?.id).toBe(secondEvent);

  // the mouse wheel scrolls every screen
  const beforeWheel = await readingRow(remote);
  await page.mouse.move(960, 500);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => readingRow(remote)).toBeGreaterThan(beforeWheel + 1);

  // back to the loaded event
  expect((await request.get('/api/load/index/3')).ok()).toBe(true);
  const loaded = (await transport()).event?.id;
  await page.keyboard.press('Home');
  await expect.poll(async () => (await transport()).event?.id).not.toEqual(loaded);
  await page.getByTestId('teleprompter-loaded').click();
  await expect.poll(async () => (await transport()).event?.id).toEqual(loaded);

  await page.getByTestId('teleprompter-play').click();
  await expect(remote.getByTestId('teleprompter-state')).toHaveAttribute('aria-label', 'Playing');
  await page.keyboard.press('Space');
  await expect(remote.getByTestId('teleprompter-state')).toHaveAttribute('aria-label', 'Paused');

  await request.get('/api/stop');
});

test('a controller switches the playback mode of the views which follow it', async ({ page, context, request }) => {
  const remote = await context.newPage();
  await remote.goto(remoteUrl);
  await expect(remote.getByTestId('teleprompter-playback-mode')).toHaveText('Event by event');

  await page.goto('/teleprompter?role=controller');
  await page.getByTestId('teleprompter-playback-mode').click();
  await expect(remote.getByTestId('teleprompter-playback-mode')).toHaveText('Whole script');
  expect((await (await request.get('/api/poll')).json()).payload.teleprompter.mode).toBe('script');

  // reopening the controller leaves the mode as it is
  await page.reload();
  await expect(page.getByTestId('teleprompter-playback-mode')).toHaveText('Whole script');
  await page.keyboard.press('m');
  await expect(remote.getByTestId('teleprompter-playback-mode')).toHaveText('Event by event');
});

test('a local view runs its own transport over the same script', async ({ page, context, request }) => {
  const transport = async () => (await (await request.get('/api/poll')).json()).payload.teleprompter;
  const remote = await context.newPage();
  await remote.goto(remoteUrl);
  await expect(remote.locator('.teleprompter__row--text').first()).toBeVisible();

  await page.goto('/teleprompter');
  await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();
  expect(await rowTexts(page)).toEqual(await rowTexts(remote));

  // the keys act on the view itself, speed changes live and is not saved
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('teleprompter-speed')).toHaveText('15lpm');
  await expect(page).not.toHaveURL(/speed=/);
  const top = await readingRow(page);
  await page.keyboard.press('Shift+ArrowDown');
  await expect.poll(() => readingRow(page)).toBeGreaterThan(top);

  // scrolling by hand moves its position, and playback carries on from there
  const beforeScroll = await readingRow(page);
  await page.mouse.move(960, 500);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => readingRow(page)).toBeGreaterThan(beforeScroll + 2);
  await page.waitForTimeout(500);
  const scrolledTo = await readingRow(page);
  await page.keyboard.press('Space');
  await expect(page.getByTestId('teleprompter-play')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => readingRow(page)).toBeGreaterThan(scrolledTo);
  expect(await readingRow(page)).toBeLessThan(scrolledTo + 1);
  await page.keyboard.press('Space');

  // none of it reaches the shared transport
  expect(await transport()).toMatchObject({ playback: 'pause', speed: 14 });
  await expect(remote.getByTestId('teleprompter-state')).toHaveAttribute('aria-label', 'Paused');
});

test('event by event, loading an event brings every remote screen to its first line', async ({ page, request }) => {
  await page.goto(remoteUrl);
  await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();

  expect((await request.get('/api/load/index/3')).ok()).toBe(true);
  const firstLine = page.locator('.teleprompter__row--text[data-loaded]').first();
  await expect(firstLine).toBeAttached();
  const row = await firstLine.evaluate((element) =>
    [...element.closest('.teleprompter__content')!.querySelectorAll('.teleprompter__row')].indexOf(element),
  );
  await expect.poll(() => readingRow(page)).toBeCloseTo(row, 2);

  await request.get('/api/stop');
});

test('Space plays and pauses, and never presses a focused button or opens a menu', async ({ page, request }) => {
  const playing = async () => (await (await request.get('/api/poll')).json()).payload.teleprompter.playback === 'play';
  await page.goto('/teleprompter?role=controller');
  await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();

  // closing the view options leaves their button focused
  await page.mouse.move(20, 20);
  await page.getByTestId('navigation__toggle-settings').click();
  await expect(page.getByTestId('apply-view-params')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('apply-view-params')).toHaveCount(0);

  await page.keyboard.press('Space');
  await expect.poll(playing).toBe(true);
  await expect(page.getByTestId('apply-view-params')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.keyboard.press('Space');
  await expect.poll(playing).toBe(false);
});

test('the end of an event shows on the reading line', async ({ page, request }) => {
  await page.goto(remoteUrl);
  await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();

  await request.get('/api/teleprompter/speed/40');
  await request.get('/api/teleprompter/play');
  await expect(page.getByTestId('teleprompter-end')).toHaveText('End of event', { timeout: 10_000 });

  await request.get('/api/teleprompter/play');
  await expect(page.getByTestId('teleprompter-end')).toHaveCount(0);
});

test('a screen showing only the loaded event says it is waiting while nothing is loaded', async ({ page, request }) => {
  await page.goto(`${remoteUrl}&onlyLoaded=true`);
  await expect(page.getByText('Waiting for an event to load', { exact: false })).toBeVisible();

  expect((await request.get('/api/load/index/2')).ok()).toBe(true);
  await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();
  await expect(page.locator('.teleprompter__row:not([data-loaded])')).toHaveCount(0);

  await request.get('/api/stop');
});

test('scrolling a local view which shows only the loaded event keeps the reader in that event', async ({
  page,
  request,
}) => {
  // give the second event enough script to scroll through
  const rundown = await (await request.get('/data/rundowns/current')).json();
  const [, second] = rundown.flatOrder.filter((id: string) => rundown.entries[id].type === 'event');
  const note = Array.from({ length: 12 }, (_, line) => `Line ${line + 1} of the second event`).join('\n');
  expect((await request.put(`/data/rundowns/${rundown.id}/entry`, { data: { id: second, note } })).ok()).toBe(true);
  expect((await request.get('/api/load/index/2')).ok()).toBe(true);

  await page.goto('/teleprompter?onlyLoaded=true');
  await expect(page.getByText('Line 1 of the second event')).toBeVisible();
  const start = await readingRow(page);

  await page.mouse.move(960, 500);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => readingRow(page)).toBeGreaterThan(start + 2);
  const scrolledTo = await readingRow(page);
  // the reader stays where they scrolled to, rather than being put back at the start of the event
  await page.waitForTimeout(500);
  expect(await readingRow(page)).toBeCloseTo(scrolledTo, 1);

  await request.get('/api/stop');
});

test('a local view keeps its place when a smaller window shrinks the text', async ({ page }) => {
  const rowHeight = () =>
    page
      .locator('.teleprompter__row')
      .first()
      .evaluate((row) => row.getBoundingClientRect().height);
  const frames = () =>
    page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        ),
    );

  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/teleprompter?mode=script');
  await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();

  // a reader three quarters down the script, past where the smaller text lets the page scroll to
  await page.getByTestId('teleprompter-scroller').evaluate((scroller) => {
    scroller.scrollTop = 0.75 * (scroller.scrollHeight - scroller.clientHeight);
  });
  await frames();
  const before = await readingRow(page);
  const largeRows = await rowHeight();

  await page.setViewportSize({ width: 800, height: 900 });
  await expect.poll(rowHeight).toBeLessThan(largeRows * 0.75);
  await frames();
  expect(await readingRow(page)).toBeCloseTo(before, 0);
});
