import { test, expect } from '@playwright/test';

test('Copy Past', async ({ page }) => {
  await page.goto('http://localhost:4001/rundown');

  // clear rundown
  await page.getByRole('button', { name: 'Clear rundown' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  //create event
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByTestId('entry-1').click();
  await page.getByLabel('Cue', { exact: true }).click();
  await page.getByLabel('Cue', { exact: true }).fill('4');
  await page.getByLabel('Cue', { exact: true }).press('Enter');
  await page.getByTestId('entry-1').click();
  await page.getByTestId('block__title').click();
  await page.getByTestId('block__title').fill('test');
  await page.getByTestId('block__title').press('Enter');

  //copy past below
  await page.locator('div').filter({ hasText: /^4$/ }).click();
  await page.locator('div').filter({ hasText: /^4$/ }).press('Control+c');
  await page.locator('div').filter({ hasText: /^4$/ }).press('Control+v');

  //assert
  await expect(page.getByTestId('entry-2')).toBeVisible();
  await expect(page.getByTestId('entry-2').getByTestId('block__title')).toHaveValue('test');
  await expect(page.getByTestId('entry-2').locator('#event-block')).toContainText('5');

  //copy past above
  await page.locator('div').filter({ hasText: /^5$/ }).click();
  await page.locator('div').filter({ hasText: /^5$/ }).press('Control+c');
  await page.locator('div').filter({ hasText: /^5$/ }).press('Control+Shift+v');

  //assert
  await expect(page.getByTestId('entry-2')).toBeVisible();
  await expect(page.getByTestId('entry-2').getByTestId('block__title')).toHaveValue('test');
  await expect(page.getByTestId('entry-2').locator('#event-block')).toContainText('4.1');
});
