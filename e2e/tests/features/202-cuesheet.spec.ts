import { expect, test } from '@playwright/test';

test('cuesheet displays events', async ({ page }) => {
  // same elements in cuesheet
  await page.goto('http://localhost:4001/cuesheet');
  await expect(page.getByText('Eurovision Song Contest')).toBeVisible();
  await expect(page.getByRole('row', { name: 'Lunch break' })).toBeVisible();

  await expect(page.locator('tr:nth-child(1) > td:nth-child(7)').first().getByRole('textbox').first()).toHaveValue(
    'Albania',
  );
  await expect(page.locator('tr:nth-child(2) > td:nth-child(7)').first().getByRole('textbox').first()).toHaveValue(
    'Latvia',
  );
  await expect(page.locator('tr:nth-child(3) > td:nth-child(7)').first().getByRole('textbox').first()).toHaveValue(
    'Lithuania',
  );
});
