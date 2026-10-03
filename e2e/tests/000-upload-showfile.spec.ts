import { expect, test } from './fixtures/override';

const fileToUpload = 'e2e/tests/fixtures/e2e-test-db.json';

test('project file upload', async ({ page }) => {
  await page.goto('/editor');

  // Try to close welcome modal if it appears (times out silently if not present)
  try {
    await page.getByText('Welcome to Ontime').waitFor({ timeout: 1000 });
    await page.getByRole('button', { name: 'close welcome modal' }).click();
  } catch {
    // Modal wasn't shown, continue with the test
  }

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('button', { name: 'Rundown menu' }).click();
  await page.getByRole('menuitem', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  await page.getByRole('button', { name: 'toggle settings' }).click();
  await page.getByRole('button', { name: 'Manage projects' }).click();

  // workaround to upload file on hidden input
  // https://playwright.dev/docs/api/class-filechooser
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(fileToUpload);

  await page.getByRole('button', { name: 'close' }).click();

  // asset test events
  const firstTitle = page.getByTestId('entry-1').getByTestId('entry__title');
  await expect(firstTitle).toHaveValue('Albania');

  const secondTitle = page.getByTestId('entry-2').getByTestId('entry__title');
  await expect(secondTitle).toHaveValue('Latvia');

  const thirdTitle = page.getByTestId('entry-3').getByTestId('entry__title');
  await expect(thirdTitle).toHaveValue('Lithuania');
});
