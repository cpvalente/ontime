import { expect, test } from '@playwright/test';

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
