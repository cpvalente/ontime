import { expect, test } from '@playwright/test';

test('cuesheet displays events', async ({ page }) => {
  // same elements in cuesheet
  await page.goto('http://localhost:4001/cuesheet');
  await expect(page.getByRole('row', { name: 'Lunch break' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'Afternoon break' })).toBeVisible();

  await expect(page.locator('#cuesheet')).toBeVisible();
});
