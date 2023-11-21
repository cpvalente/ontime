import { test, expect } from '@playwright/test';

test('test aliases feature, it should redirect to given alias', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  // open settings
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('tab', { name: 'URL Aliases' }).click();

  // create alias
  await page.getByRole('button', { name: 'Add new' }).click();
  await page.getByTestId('field__alias_1').fill('testing');
  await page.getByTestId('field__url_1').fill('countdown');
  await page.getByTestId('field__enable_1').click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).click();

  // make sure alias works
  await page.goto('http://localhost:4001/testing');
  await page.getByText('Select an event to follow').click();
});
