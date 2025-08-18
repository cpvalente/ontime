import { test, expect } from '@playwright/test';

test('View params configures timer view', async ({ page }) => {
  await page.goto('http://localhost:4001/timer');

  await expect(page.getByText('TIME NOW')).toBeInViewport();

  await page.mouse.move(Math.random() * 100, Math.random() * 100);
  await page.getByTestId('navigation__toggle-settings').click();
  await page.locator('label').filter({ hasText: 'Hide Time NowHides the Time' }).locator('span').nth(2).click();
  await page.getByTestId('apply-view-params').click();
  await page.getByTestId('close-view-params').click();

  await expect(page.getByText('TIME NOW', { exact: true })).not.toBeInViewport();
  await expect(page).toHaveURL(/.*hideClock=true/);
});
