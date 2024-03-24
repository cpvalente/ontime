import { expect, test } from '@playwright/test';
import fs from 'fs';

test('project file exports csv', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  await page.getByTestId('navigation__toggle-settings').click();
  await page.getByRole('button', { name: 'Manage project files' }).click();

  await page.getByRole('cell', { name: 'test-db' }).click();
  await page
    .getByRole('row', { name: /test-db/ })
    .getByLabel('Options')
    .click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'Export CSV Rundown' }).click();

  function validateCSV(contents: string) {
    // We should try to keep this in sync with the implementation over at cuesheetUtils.ts
    const expectedHeader = ['Project title: Eurovision Song Contest', 'Project description: Turin 2022'];
    const expectedColumns = [
      'Time Start',
      'Time End',
      'Duration',
      'ID',
      'Colour',
      'Cue',
      'Title',
      'Note',
      'Is Public? (x)',
      'Skip?',
    ];
    const expectedValues = ['Albania', 'Latvia', 'Lithuania', 'Lunch break'];

    const allExpected = [...expectedHeader, ...expectedColumns, ...expectedValues];
    return allExpected.every((value) => {
      return contents.toLowerCase().includes(value.toLowerCase());
    });
  }

  const download = await downloadPromise;
  const contents = await fs.promises.readFile(await download.path(), 'utf-8');
  expect(validateCSV(contents)).toBe(true);
});
