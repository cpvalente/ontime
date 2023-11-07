import { test } from '@playwright/test';

const fileToUpload = 'e2e/tests/fixtures/test-db.json';

test('test project file upload', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');
  await page.getByRole('button', { name: 'Event...' }).click();
  await page.getByRole('menuitem', { name: 'Delete all events' }).click();

  await page.getByRole('button', { name: 'Import project file' }).click();

  // workaround to upload file on hidden input
  // https://playwright.dev/docs/api/class-filechooser
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    await page.getByText('Click to select Ontime project or xlsx rundown').click(),
  ]);

  await fileChooser.setFiles(fileToUpload);

  // there is only one step for normal imports
  await page.getByRole('button', { name: 'Import' }).click();

  // asset test events
  await page.getByPlaceholder('Start').first().click();
  await page.getByText('First test event').click();
  await page.getByTestId('delay-input').click();
  await page
    .locator('div')
    .filter({ hasText: /^SED\+10 minNew start: 10:10:00$/ })
    .getByPlaceholder('Start')
    .click();
  await page.getByText('+10 minNew start: 10:10:00').click();
  await page.getByText('Second test event').click();
  await page.getByText('Lunch').click();
  await page.getByText('Third test event').click();
});
