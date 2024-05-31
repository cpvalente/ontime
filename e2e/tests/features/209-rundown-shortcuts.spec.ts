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

test('Move', async ({ page }) => {
  await page.goto('http://localhost:4001/rundown');

  // clear rundown
  await page.getByRole('button', { name: 'Clear rundown' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  //create events
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('button', { name: 'Event' }).nth(4).click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  //copy move down
  await page.getByTestId('entry-1').locator('#event-block').getByText('1').click();
  await page.getByTestId('entry-1').locator('#event-block div').filter({ hasText: '1' }).press('Alt+Control+ArrowDown');
  await expect(page.getByTestId('entry-2').locator('#event-block')).toContainText('1');

  //copy move up
  await page.getByTestId('entry-3').locator('#event-block').getByText('3').click();
  await page.getByTestId('entry-3').locator('#event-block div').filter({ hasText: '3' }).press('Alt+Control+ArrowUp');
  await page.getByTestId('entry-2').locator('div').filter({ hasText: /^3$/ }).press('Alt+Control+ArrowUp');
  await expect(page.getByTestId('entry-1').locator('#event-block')).toContainText('3');
});
