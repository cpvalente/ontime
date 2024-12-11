import { expect, test } from '@playwright/test';

test('cuesheet displays events', async ({ page }) => {
  // same elements in cuesheet
  await page.goto('http://localhost:4001/cuesheet');
  await expect(page.getByText('Eurovision Song Contest')).toBeVisible();
  await expect(page.getByRole('row', { name: 'Lunch break' })).toBeVisible();

  await expect(
    page.getByRole('row', { name: 'SF1.01 10:00:00 10:20:00 00:20:00' }).getByRole('textbox').first(),
  ).toHaveValue('Albania');

  await expect(
    page.getByRole('row', { name: 'SF1.02 10:25:00 10:45:00 00:20:00' }).getByRole('textbox').first(),
  ).toHaveValue('Latvia');

  await expect(
    page.getByRole('row', { name: 'SF1.03 10:50:00 11:10:00 00:20:00' }).getByRole('textbox').first(),
  ).toHaveValue('Lithuania');
});
