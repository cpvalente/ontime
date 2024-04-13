import { expect, test } from '@playwright/test';

test('URL preset feature, it should redirect to given URL', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  // open settings
  await page.getByRole('button', { name: 'Toggle settings' }).click();
  await page.getByRole('button', { name: 'Feature Settings' }).click();

  // create preset
  await page.getByTestId('url-preset-form').scrollIntoViewIfNeeded();

  await page.getByTestId('url-preset-form').getByRole('button', { name: 'New' }).scrollIntoViewIfNeeded();
  await page.getByTestId('url-preset-form').getByRole('button', { name: 'New' }).click();

  await page.getByTestId('field__alias_0').click();
  await page.getByTestId('field__alias_0').fill('testing');

  await page.getByTestId('field__url_0').click();
  await page.getByTestId('field__url_0').fill('countdown');

  await page.getByTestId('field__enable_0').click();

  await page.getByTestId('url-preset-form').getByRole('button', { name: 'Save', exact: true }).click();

  // make sure preset works
  await page.goto('http://localhost:4001/testing');
  await page.getByTestId('countdown__select').click();
  await expect(page.getByTestId('countdown__select')).toBeVisible();
});
