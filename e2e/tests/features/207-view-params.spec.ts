import { expect, test } from '@playwright/test';

test('View params configures timer view', async ({ page }) => {
  await page.goto('/timer');

  await expect(page.getByText('TIME NOW')).toBeInViewport();

  await page.mouse.move(Math.random() * 100, Math.random() * 100);
  await page.getByTestId('navigation__toggle-settings').click();
  await page.locator('label').filter({ hasText: 'Hide Time NowHides the Time' }).locator('span').nth(2).click();
  await page.getByTestId('apply-view-params').click();

  await expect(page.getByText('TIME NOW', { exact: true })).not.toBeInViewport();
  await expect(page).toHaveURL(/.*hideClock=true/);
});

test('View params configures teleprompter view', async ({ page, request }) => {
  const response = await request.post('/data/db/demo');
  expect(response.ok()).toBe(true);

  await page.goto('/teleprompter?script=note');

  const readingMarker = page.locator('.teleprompter__reading-marker');
  await expect(readingMarker).toBeVisible();

  await page.mouse.move(Math.random() * 100, Math.random() * 100);
  await page.getByTestId('navigation__toggle-settings').click();

  const readingLineSwitch = page.locator('label:has(input[name="readingLine"]) [role="switch"]');
  await expect(readingLineSwitch).toHaveAttribute('aria-checked', 'true');

  await readingLineSwitch.click();
  await page.getByTestId('apply-view-params').click();

  await expect(page).toHaveURL(/.*readingLine=false/);
  await expect(readingMarker).toHaveCount(0);
});
