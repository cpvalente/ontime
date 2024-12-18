import { expect, test } from '@playwright/test';

test('cuesheet displays events', async ({ page }) => {
  // same elements in cuesheet
  await page.goto('http://localhost:4001/cuesheet');
  await expect(page.getByText('Eurovision Song Contest')).toBeVisible();
  await expect(page.getByRole('row', { name: 'Lunch break' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'Afternoon break' })).toBeVisible();

  await expect(page.locator('#cuesheet')).toBeVisible();

  // there should be 16 rows in the table (same as the amount of events in the rundown)
  const rowCount = await page.locator('#cuesheet tbody tr').count();
  expect(rowCount).toBe(16);
});
