import { test } from '@playwright/test';

const fileToUpload = 'e2e/tests/fixtures/test-db.json';

test('test project file upload', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');
  await page.getByRole('button', { name: 'Rundown menu' }).click();
  await page.getByRole('menuitem', { name: 'Delete all events' }).click();

  await page.getByRole('button', { name: 'Application settings' }).click();
  await page.getByRole('button', { name: 'Project', exact: true }).click();

  // workaround to upload file on hidden input
  // https://playwright.dev/docs/api/class-filechooser
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(fileToUpload);

  await page.getByRole('button', { name: 'close' }).click();

  // asset test events
  await page.getByText('Albania').click();
  await page.getByText('Latvia').click();
  await page.getByText('Lithuania').click();
});
