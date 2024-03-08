import { test } from '@playwright/test';

test('test URL preset feature, it should redirect to given URL', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  // open settings
  await page.getByRole('button', { name: 'Settings deprecated' }).click();
  await page.getByRole('tab', { name: 'URL Aliases' }).click();

  // create preset
  await page.getByRole('button', { name: 'Add new' }).click();
  await page.getByTestId('field__alias_1').fill('testing');
  await page.getByTestId('field__url_1').fill('countdown');
  await page.getByTestId('field__enable_1').click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).click();

  // make sure preset            works
  await page.goto('http://localhost:4001/testing');
  await page.getByTestId('countdown__select').click();
});
