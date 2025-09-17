import { expect, test } from '@playwright/test';

test('time until absolute', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  await page.getByRole('button', { name: 'Absolute' }).click();
  await page.getByTestId('entry-1').getByLabel('Start event').click();
  await expect(page.getByTestId('offset')).not.toContainText('00:00:00'); // This might be a bad test requires that the test is not run at 0h
  await page.getByLabel('Pause event').click();

  await expect(page.getByTestId('entry-2').getByTestId('rundown-event')).toContainText('9m');
  await expect(page.getByTestId('entry-3').getByTestId('rundown-event')).toContainText('19m');
  await expect(page.getByTestId('entry-4').getByTestId('rundown-event')).toContainText('29m');

  await page.getByTestId('entry-1').getByTestId('time-input-duration').click();
  await page.getByTestId('entry-1').getByTestId('time-input-duration').fill('6h');
  await page.getByTestId('entry-1').getByTestId('time-input-duration').press('Enter');

  await expect(page.getByTestId('entry-2').getByTestId('rundown-event')).toContainText('5h59m');
  await expect(page.getByTestId('entry-3').getByTestId('rundown-event')).toContainText('6h9m');
  await expect(page.getByTestId('entry-4').getByTestId('rundown-event')).toContainText('6h19m');

  await page.getByTestId('entry-1').getByTestId('time-input-duration').click();
  await page.getByTestId('entry-1').getByTestId('time-input-duration').fill('30s');
  await page.getByTestId('entry-1').getByTestId('time-input-duration').press('Enter');

  await expect(page.getByTestId('entry-2').getByTestId('rundown-event')).toContainText('30s');
  await expect(page.getByTestId('entry-3').getByTestId('rundown-event')).toContainText('10m');
  await expect(page.getByTestId('entry-4').getByTestId('rundown-event')).toContainText('20m');
});

test('time until relative', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('button', { name: 'Event' }).nth(4).click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  await page.getByRole('button', { name: 'Relative' }).click();
  await page.getByTestId('entry-1').getByLabel('Start event').click();
  await expect(page.getByTestId('offset')).toContainText('00:00:00'); // This might be a bad test as it ruires the evaluation to happen within 1s
  await page.getByLabel('Pause event').click();

  await expect(page.getByTestId('entry-2').getByTestId('rundown-event')).toContainText('9m');
  await expect(page.getByTestId('entry-3').getByTestId('rundown-event')).toContainText('19m');
  await expect(page.getByTestId('entry-4').getByTestId('rundown-event')).toContainText('29m');

  await page.getByTestId('entry-1').getByTestId('time-input-duration').click();
  await page.getByTestId('entry-1').getByTestId('time-input-duration').fill('6h');
  await page.getByTestId('entry-1').getByTestId('time-input-duration').press('Enter');

  await expect(page.getByTestId('entry-2').getByTestId('rundown-event')).toContainText('5h59m');
  await expect(page.getByTestId('entry-3').getByTestId('rundown-event')).toContainText('6h9m');
  await expect(page.getByTestId('entry-4').getByTestId('rundown-event')).toContainText('6h19m');

  await page.getByTestId('entry-1').getByTestId('time-input-duration').click();
  await page.getByTestId('entry-1').getByTestId('time-input-duration').fill('30s');
  await page.getByTestId('entry-1').getByTestId('time-input-duration').press('Enter');

  await expect(page.getByTestId('entry-2').getByTestId('rundown-event')).toContainText('30s');
  await expect(page.getByTestId('entry-3').getByTestId('rundown-event')).toContainText('10m');
  await expect(page.getByTestId('entry-4').getByTestId('rundown-event')).toContainText('20m');

  await page.getByRole('button', { name: 'Absolute' }).click();
});
