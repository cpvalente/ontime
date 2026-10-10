import type { APIRequestContext, Page } from '@playwright/test';

import { expect, test } from '../fixtures/override';

const remoteUrl = '/teleprompter?remoteControl=true';

/** A paused transport at the top, since the transport outlives each test */
async function resetTransport(request: APIRequestContext) {
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

// the tests read the demo project's script
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  expect((await context.request.post('/data/db/demo')).ok()).toBe(true);
  await context.close();
});

test.beforeEach(async ({ request }) => {
  await resetTransport(request);
});

test.afterEach(async ({ request }) => {
  await resetTransport(request);
});

test('a remote screen shows the shared script and answers only to ?', async ({ page, request }) => {
  await page.goto(remoteUrl);
  await expect(page.getByText('Music plays, holding slide on', { exact: true })).toBeVisible();
  await expect(page.getByTestId('teleprompter-status')).toHaveText('Paused');
  const before = await readingRow(page);

  for (const key of ['Space', 'ArrowDown', 'ArrowRight', 'PageDown', 'Shift+ArrowDown']) {
    await page.keyboard.press(key);
  }
  await expect(page.getByTestId('teleprompter-status')).toHaveText('Paused');
  await expect(page.getByTestId('teleprompter-speed')).toHaveText('14lpm');
  expect(await readingRow(page)).toBe(before);
  expect((await (await request.get('/api/poll')).json()).payload.teleprompter.playing).toBe(false);

  // the navigation menu leaves Space to the view
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.keyboard.press('?');
  await expect(page.getByTestId('teleprompter-help')).toBeVisible();
});

test('a screen which connects late lands on the line the others show', async ({ page, context, request }) => {
  await page.goto(remoteUrl);
  await expect(page.locator('.teleprompter__row').first()).toBeAttached();

  const start = await readingRow(page);
  await request.get('/api/teleprompter/speed/20');
  await request.get('/api/teleprompter/play');
  await expect.poll(() => readingRow(page)).toBeGreaterThan(start + 0.3);

  const late = await context.newPage();
  await late.goto(remoteUrl);
  await expect(late.locator('.teleprompter__row').first()).toBeAttached();
  await expect(late.getByTestId('teleprompter-status')).toHaveText('Playing');

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

test('a remote screen ignores options which would change where lines break', async ({ page }) => {
  await page.goto(remoteUrl);
  await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();
  const shared = await rowTexts(page);

  await page.goto(`${remoteUrl}&charsPerLine=10&script=title&heading=none&hideEmpty=false`);
  await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();
  expect(await rowTexts(page)).toEqual(shared);
});

test('a controller drives every remote screen with its keys, wheel and buttons', async ({ page, context, request }) => {
  const transport = async () => (await (await request.get('/api/poll')).json()).payload.teleprompter;

  await page.goto('/teleprompter?control=true');
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
  await expect(remote.getByTestId('teleprompter-status')).toHaveText('Playing');
  await page.keyboard.press('Space');
  await expect(remote.getByTestId('teleprompter-status')).toHaveText('Paused');

  await request.get('/api/stop');
});

test('a local view runs its own transport over a script cut with its own options', async ({
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
  // the wheel moves the view in steps, so wait until it rests
  let previousRow = -1;
  await expect
    .poll(async () => {
      const row = await readingRow(page);
      const isResting = Math.abs(row - previousRow) < 0.01;
      previousRow = row;
      return isResting;
    })
    .toBe(true);
  const scrolledTo = previousRow;
  await page.keyboard.press('Space');
  await expect(page.getByTestId('teleprompter-status')).toHaveText('Playing');
  await expect.poll(() => readingRow(page)).toBeGreaterThan(scrolledTo);
  expect(await readingRow(page)).toBeLessThan(scrolledTo + 1);
  await page.keyboard.press('Space');

  // none of it reaches the shared transport
  expect(await transport()).toMatchObject({ playing: false, speed: 14 });
  await expect(remote.getByTestId('teleprompter-status')).toHaveText('Paused');
});

test('cued, loading an event brings every remote screen to its first line', async ({ page, request }) => {
  await page.goto(remoteUrl);
  await expect(page.locator('.teleprompter__row--text').first()).toBeVisible();

  expect((await request.get('/api/load/index/3')).ok()).toBe(true);
  const firstLine = page.locator('.teleprompter__row--text[data-loaded]').first();
  await expect(firstLine).toBeAttached();
  const row = await firstLine.evaluate((element) => [...element.parentElement!.children].indexOf(element));
  await expect.poll(() => readingRow(page)).toBeCloseTo(row, 2);

  await request.get('/api/stop');
});
