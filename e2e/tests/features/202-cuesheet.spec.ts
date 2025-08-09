import { expect, test } from '@playwright/test';

test('cuesheet displays events', async ({ page }) => {
  // same elements in cuesheet
  await page.goto('http://localhost:4001/cuesheet');
  await expect(page.getByRole('row', { name: 'Lunch break' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'Afternoon break' })).toBeVisible();

  await expect(page.locator('#cuesheet')).toBeVisible();

  // there should be 16 rows in the table (same as the amount of events in the rundown)
  await expect(page.getByTestId('cuesheet-event')).toHaveCount(14);
  await expect(page.getByTestId('cuesheet-group')).toHaveCount(2);
});
