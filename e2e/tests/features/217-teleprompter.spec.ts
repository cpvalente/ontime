import type { APIRequestContext, Page } from '@playwright/test';

import { expect, test } from '../fixtures/override';

const remoteUrl = '/teleprompter?role=remote';

/** Restores the demo project and a paused transport at the top, which the transport outlives */
async function resetTeleprompter(request: APIRequestContext) {
  expect((await request.post('/data/db/demo')).ok()).toBe(true);
  for (const command of ['pause', 'speed/14', 'top']) {
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

test('RMT-1 a remote screen shows the shared script and answers only to ?', async ({ page, request }) => {
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
  expect((await (await request.get('/api/poll')).json()).payload.teleprompter.playing).toBe(false);

  // INT-2 the navigation menu leaves Space to the view
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.keyboard.press('?');
  await expect(page.getByTestId('teleprompter-help')).toBeVisible();
});

test('RMT-3 a screen which connects late lands on the line the others show', async ({ page, context, request }) => {
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

  await request.get('/api/teleprompter/pause');
  await expect.poll(async () => Math.abs((await readingRow(page)) - (await readingRow(late)))).toBeLessThan(0.001);
});

test('DSP-1 DSP-2 every screen shows the same lines, each sized to fit the text width', async ({ page }) => {
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

test('DSP-5 the loaded event is highlighted and the rest of the script dimmed', async ({ page, request }) => {
  await page.goto(remoteUrl);
  expect((await request.get('/api/load/index/2')).ok()).toBe(true);

  const loaded = page.locator('.teleprompter__row[data-loaded]');
  await expect(loaded.first()).toBeVisible();
  await expect(page.locator('.teleprompter__row--heading[data-loaded]')).toHaveCSS('opacity', '1');
  await expect(page.locator('.teleprompter__row:not([data-loaded])').first()).toHaveCSS('opacity', '0.45');

  await request.get('/api/stop');
});

test('SET-2 a remote screen ignores options which would change where lines break', async ({ page }) => {
  await page.goto(remoteUrl);
  await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();
  const shared = await rowTexts(page);

  await page.goto(`${remoteUrl}&charsPerLine=10&script=title&heading=none&hideEmpty=false`);
  await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();
  expect(await rowTexts(page)).toEqual(shared);
});

test('DSP-3 the reading line comes from the view options', async ({ page }) => {
  await page.goto(remoteUrl);
  await expect(page.getByTestId('teleprompter-reading-line')).toBeVisible();

  await page.mouse.move(Math.random() * 100, Math.random() * 100);
  await page.getByTestId('navigation__toggle-settings').click();
  const readingLineSwitch = page.locator('label:has(input[name="readingLine"]) [role="switch"]');
  await expect(readingLineSwitch).toHaveAttribute('aria-checked', 'true');
  await readingLineSwitch.click();
  await page.getByTestId('apply-view-params').click();

  await expect(page).toHaveURL(/.*readingLine=false/);
  await expect(page.getByTestId('teleprompter-reading-line')).toHaveCount(0);
});

test('CTL-1 CTL-4 a controller drives every remote screen with its keys, wheel and buttons', async ({
  page,
  context,
  request,
}) => {
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
  const secondEvent = (await transport()).eventId;
  await page.getByTestId('teleprompter-next').click();
  await expect.poll(async () => (await transport()).eventId).not.toBe(secondEvent);
  await page.getByTestId('teleprompter-previous').click();
  await expect.poll(async () => (await transport()).eventId).toBe(secondEvent);

  // the mouse wheel scrolls every screen
  const beforeWheel = await readingRow(remote);
  await page.mouse.move(960, 500);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => readingRow(remote)).toBeGreaterThan(beforeWheel + 1);

  // back to the loaded event
  expect((await request.get('/api/load/index/3')).ok()).toBe(true);
  const loaded = (await transport()).anchor;
  await page.keyboard.press('Home');
  await expect.poll(async () => (await transport()).anchor).not.toEqual(loaded);
  await page.getByTestId('teleprompter-loaded').click();
  await expect.poll(async () => (await transport()).anchor).toEqual(loaded);

  await page.getByTestId('teleprompter-play').click();
  await expect(remote.getByTestId('teleprompter-state')).toHaveAttribute('aria-label', 'Playing');
  await page.keyboard.press('Space');
  await expect(remote.getByTestId('teleprompter-state')).toHaveAttribute('aria-label', 'Paused');

  await request.get('/api/stop');
});

test('LOC-1 LOC-2 a local view runs its own transport over a script cut with its own options', async ({
  page,
  context,
  request,
}) => {
  const transport = async () => (await (await request.get('/api/poll')).json()).payload.teleprompter;
  const remote = await context.newPage();
  await remote.goto(remoteUrl);
  await expect(remote.locator('.teleprompter__row--text').first()).toBeVisible();

  await page.goto('/teleprompter?charsPerLine=20');
  await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();
  // its own options cut the script differently
  expect(await rowTexts(page)).not.toEqual(await rowTexts(remote));

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
  expect(await transport()).toMatchObject({ playing: false, speed: 14 });
  await expect(remote.getByTestId('teleprompter-state')).toHaveAttribute('aria-label', 'Paused');
});

test('TRN-3 cued, loading an event brings every remote screen to its first line', async ({ page, request }) => {
  await page.goto(remoteUrl);
  await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();

  expect((await request.get('/api/load/index/3')).ok()).toBe(true);
  const firstLine = page.locator('.teleprompter__row--text[data-loaded]').first();
  await expect(firstLine).toBeAttached();
  const row = await firstLine.evaluate((element) => [...element.parentElement!.children].indexOf(element));
  await expect.poll(() => readingRow(page)).toBeCloseTo(row, 2);

  await request.get('/api/stop');
});

test('CTL-4 going back to the loaded event is offered only when the reader is away from it', async ({
  page,
  request,
}) => {
  await page.goto('/teleprompter?role=controller');
  const goToLoaded = page.getByTestId('teleprompter-loaded');
  await expect(goToLoaded).toHaveText('No event loaded');
  await expect(goToLoaded).toBeDisabled();

  expect((await request.get('/api/load/index/2')).ok()).toBe(true);
  await expect(goToLoaded).toHaveText(/^Reading loaded event/);
  await expect(goToLoaded).toBeDisabled();

  await page.keyboard.press('Home');
  await expect(goToLoaded).toHaveText(/^Go to loaded event/);
  await goToLoaded.click();
  await expect(goToLoaded).toBeDisabled();

  await request.get('/api/stop');
});

test('INT-2 Space plays and pauses, and never presses a focused button or opens a menu', async ({ page, request }) => {
  const playing = async () => (await (await request.get('/api/poll')).json()).payload.teleprompter.playing;
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

test('DSP-7 the controls stay while the pointer is over them', async ({ page }) => {
  await page.goto('/teleprompter?role=controller');
  const controls = page.getByTestId('teleprompter-controls');
  await controls.hover();
  await page.waitForTimeout(4000);
  await expect(controls).not.toHaveClass(/idle/);

  await page.mouse.move(400, 100);
  await expect(controls).toHaveClass(/idle/, { timeout: 6000 });
});

test('DSP-8 the end of an event shows on the reading line, without the controls', async ({ page, request }) => {
  await page.goto(remoteUrl);
  await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();

  await request.get('/api/teleprompter/speed/40');
  await request.get('/api/teleprompter/play');
  await expect(page.getByTestId('teleprompter-end')).toHaveText('End of event', { timeout: 10_000 });
  await expect(page.getByTestId('teleprompter-controls')).toHaveClass(/idle/, { timeout: 6000 });
  await expect(page.getByTestId('teleprompter-end')).toBeVisible();

  await request.get('/api/teleprompter/play');
  await expect(page.getByTestId('teleprompter-end')).toHaveCount(0);
});

test('DSP-6 a screen showing only the loaded event says it is waiting while nothing is loaded', async ({
  page,
  request,
}) => {
  await page.goto(`${remoteUrl}&onlyLoaded=true`);
  await expect(page.getByText('Waiting for an event to load', { exact: false })).toBeVisible();

  expect((await request.get('/api/load/index/2')).ok()).toBe(true);
  await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();
  await expect(page.locator('.teleprompter__row:not([data-loaded])')).toHaveCount(0);

  await request.get('/api/stop');
});
