import { expect, test } from '@playwright/test';

test('URL preset feature, it should redirect to given URL', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  const aliasName = 'testing';
  const aliasUrl = 'www.getontime.no/team/countdown';

  // open settings
  await page.getByRole('button', { name: 'Toggle settings' }).click();
  await page.getByRole('button', { name: 'URL Presets' }).click();

  // create preset
  await page.getByRole('heading', { name: 'URL presets New' }).getByRole('button').scrollIntoViewIfNeeded();
  await page.getByRole('heading', { name: 'URL presets New' }).getByRole('button').click();

  await page.locator('input[name="alias"]').click();
  await page.locator('input[name="alias"]').fill(aliasName);

  await page.getByRole('textbox', { name: 'Paste URL' }).click();
  await page.getByRole('textbox', { name: 'Paste URL' }).fill(aliasUrl);
  await page.getByRole('button', { name: 'Generate' }).click();

  await page.getByRole('combobox').filter({ hasText: 'Countdown' });

  await page.getByRole('button', { name: 'Save' }).click();

  // make sure preset works
  await page.goto('http://localhost:4001/testing');
  await expect(page.getByTestId('countdown-view')).toBeVisible();
});
