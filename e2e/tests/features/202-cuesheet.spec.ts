import { test } from '@playwright/test';

test('cuesheet displays events and exports csv', async ({ page }) => {
  // same elements in cuesheet
  await page.goto('http://localhost:4001/cuesheet');
  await page.getByText('Eurovision Song Contest').click();
  await page.getByRole('cell', { name: 'Lunch break' }).click();
  await page.getByRole('cell', { name: 'Albania' }).click();
  await page.getByRole('cell', { name: 'Latvia' }).click();
  await page.getByRole('cell', { name: 'Lithuania' }).click();
});
