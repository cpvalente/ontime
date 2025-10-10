import { expect, test } from '@playwright/test';

test('show warning when event crosses midnight', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('button', { name: 'Event' }).nth(4).click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await page.getByTestId('entry-2').getByTestId('lock__end').getByRole('img').click();
  await page.getByTestId('entry-2').getByTestId('time-input-timeEnd').click();
  await page.getByTestId('entry-2').getByTestId('time-input-timeEnd').fill('23h');
  await page.getByTestId('entry-2').getByTestId('time-input-timeEnd').press('Enter');
  await page.getByTestId('entry-3').getByTestId('time-input-duration').click();
  await page.getByTestId('entry-3').getByTestId('time-input-duration').fill('2h');
  await page.getByTestId('entry-3').getByTestId('time-input-duration').press('Enter');

  await expect(page.getByTestId('entry-3').getByTestId('event-warning')).toBeVisible();
});

test('show warning when event starts next day midnight', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('button', { name: 'Event' }).nth(4).click();
  await page.getByTestId('entry-2').getByTestId('lock__end').click();
  await page.getByTestId('entry-2').getByTestId('time-input-timeEnd').click();
  await page.getByTestId('entry-2').getByTestId('time-input-timeEnd').fill('0');
  await page.getByTestId('entry-2').getByTestId('time-input-timeEnd').press('Enter');
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  await expect(page.getByText('(next day)')).toBeVisible();
});
