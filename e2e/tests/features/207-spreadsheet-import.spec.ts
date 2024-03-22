import { expect, test } from '@playwright/test';

const fileToUpload = 'e2e/tests/fixtures/test-sheet.xlsx';

test('sheet file upload', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');
  await page.getByRole('button', { name: 'Rundown menu' }).click();
  await page.getByRole('menuitem', { name: 'Delete all events' }).click();

  await page.getByRole('button', { name: 'Application settings' }).click();
  await page.getByRole('button', { name: 'Import spreadsheet' }).click();

  // workaround to upload file on hidden input
  // https://playwright.dev/docs/api/class-filechooser
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import from spreadsheet', exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(fileToUpload);

  const worksheetOption1 = page.getByTestId('worksheetName-0');
  await expect(worksheetOption1).toHaveValue('Sheet2');

  const worksheetOption2 = page.getByTestId('worksheetName-1');
  await expect(worksheetOption2).toHaveValue('test');

  await page.getByRole('button', { name: 'Import preview' }).click();
  await page.getByRole('button', { name: 'Apply' }).click();
  await page.getByRole('button', { name: 'Return' }).click();
  await page.getByLabel('close').click();

  // asset test events
  const firstTitle = page.getByTestId('entry-1').getByTestId('block__title');
  await expect(firstTitle).toHaveValue('Attempt light check');

  const secondTitle = page.getByTestId('entry-2').getByTestId('block__title');
  await expect(secondTitle).toHaveValue('Preset');

  const thirdTitle = page.getByTestId('entry-3').getByTestId('block__title');
  await expect(thirdTitle).toHaveValue('Albania');
});
