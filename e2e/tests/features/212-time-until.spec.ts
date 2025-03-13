import { expect, test } from '@playwright/test';

test('linked time until', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  await page.getByRole('button', { name: 'Clear rundown' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('button', { name: 'Event' }).nth(4).click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  await page.getByTestId('entry-1').getByLabel('Start event').click();
  await page.getByLabel('Pause event').click();

  await page.getByRole('button', { name: 'Absolute' }).click();
  await expect(page.getByTestId('entry-2').locator('#event-block')).toContainText('9m');
  await expect(page.getByTestId('entry-3').locator('#event-block')).toContainText('19m');
  await expect(page.getByTestId('entry-4').locator('#event-block')).toContainText('29m');

  await page.getByRole('button', { name: 'Relative' }).click();
  await expect(page.getByTestId('entry-2').locator('#event-block')).toContainText('9m');
  await expect(page.getByTestId('entry-3').locator('#event-block')).toContainText('19m');
  await expect(page.getByTestId('entry-4').locator('#event-block')).toContainText('29m');

  await page.getByTestId('entry-1').getByTestId('time-input-duration').click();
  await page.getByTestId('entry-1').getByTestId('time-input-duration').fill('6h');
  await page.getByTestId('entry-1').getByTestId('time-input-duration').press('Enter');

  await page.getByRole('button', { name: 'Absolute' }).click();
  await expect(page.getByTestId('entry-2').locator('#event-block')).toContainText('5h59m');
  await expect(page.getByTestId('entry-3').locator('#event-block')).toContainText('6h9m');
  await expect(page.getByTestId('entry-4').locator('#event-block')).toContainText('6h19m');

  await page.getByRole('button', { name: 'Relative' }).click();
  await expect(page.getByTestId('entry-2').locator('#event-block')).toContainText('5h59m');
  await expect(page.getByTestId('entry-3').locator('#event-block')).toContainText('6h9m');
  await expect(page.getByTestId('entry-4').locator('#event-block')).toContainText('6h19m');

  await page.getByTestId('entry-1').getByTestId('time-input-duration').click();
  await page.getByTestId('entry-1').getByTestId('time-input-duration').fill('30s');
  await page.getByTestId('entry-1').getByTestId('time-input-duration').press('Enter');

  await page.getByRole('button', { name: 'Absolute' }).click();
  await expect(page.getByTestId('entry-2').locator('#event-block')).toContainText('29s');
  await expect(page.getByTestId('entry-3').locator('#event-block')).toContainText('10m');
  await expect(page.getByTestId('entry-4').locator('#event-block')).toContainText('20m');

  await page.getByRole('button', { name: 'Relative' }).click();
  await expect(page.getByTestId('entry-2').locator('#event-block')).toContainText('29s');
  await expect(page.getByTestId('entry-3').locator('#event-block')).toContainText('10m');
  await expect(page.getByTestId('entry-4').locator('#event-block')).toContainText('20m');
});
