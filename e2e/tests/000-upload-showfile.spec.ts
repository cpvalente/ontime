import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

import { readFile, unlink } from 'fs/promises';

const fileToUpload = 'e2e/tests/fixtures/e2e-test-db.json';
const fileToDownload = 'e2e/tests/fixtures/tmp/';

test('project file upload', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  if (await page.getByText('Welcome to Ontime')) {
    await page.getByRole('button', { name: 'Close' }).click();
  }

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('button', { name: 'Clear rundown' }).click();
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
  const firstTitle = page.getByTestId('entry-1').getByTestId('block__title');
  await expect(firstTitle).toHaveValue('Albania');

  const secondTitle = page.getByTestId('entry-2').getByTestId('block__title');
  await expect(secondTitle).toHaveValue('Latvia');

  const thirdTitle = page.getByTestId('entry-3').getByTestId('block__title');
  await expect(thirdTitle).toHaveValue('Lithuania');
});

//TODO: this works when testing locally, but not in github actions
test.fixme('project file download', async ({ page }) => {
  await page.goto('http://localhost:4001/editor/?settings=project__manage');

  await page
    .getByRole('row', { name: /.*currently loaded/i })
    .getByLabel('Options')
    .click();
  // workaround to download
  // https://playwright.dev/docs/api/class-download
  const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
  await page.getByRole('menuitem', { name: 'Download' }).click();

  const download = await downloadPromise;

  // Wait for the download process to complete and save the downloaded file somewhere.
  const uniqFileToDownload = fileToDownload + randomUUID() + '.json';
  await download.saveAs(uniqFileToDownload);
  expect(download.failure()).toMatchObject({});

  const original = JSON.parse(await readFile(fileToUpload, { encoding: 'utf-8' }));
  const fromServer = JSON.parse(await readFile(uniqFileToDownload, { encoding: 'utf-8' }));

  await unlink(uniqFileToDownload);

  // when a file is parsed, the server will write the version number to the project file
  original.settings.version = 'not-important';
  fromServer.settings.version = 'not-important';
  expect(original).toMatchObject(fromServer);
});
