import { test, expect } from '@playwright/test';

test('View params configures timer view', async ({ page }) => {
  await page.goto('http://localhost:4001/timer');

  await expect(page.getByText('TIME NOW')).toBeInViewport();

  await page.getByTestId('navigation__toggle-settings').click();
  await page.locator('label').filter({ hasText: 'Hide Time NowHides the Time' }).locator('span').nth(2).click();
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page).toHaveURL(/.*hideClock=true/);
  await expect(page.getByText('TIME NOW')).not.toBeInViewport();
});
