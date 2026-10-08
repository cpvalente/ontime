import type { APIRequestContext, Page } from '@playwright/test';

import { expect, test } from '../fixtures/override';

const remoteUrl = '/teleprompter?remoteControl=true';

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
  await expect(page.getByTestId('teleprompter-status')).toHaveText('Paused');
  const before = await readingRow(page);

  for (const key of ['Space', 'ArrowDown', 'ArrowRight', 'PageDown', 'Shift+ArrowDown']) {
    await page.keyboard.press(key);
  }
  await expect(page.getByTestId('teleprompter-status')).toHaveText('Paused');
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
