import { expect, test } from '@playwright/test';
import fs from 'fs';

test('cuesheet displays events and exports csv', async ({ page }) => {
  // same elements in cuesheet
  await page.goto('http://localhost:4001/cuesheet');
  await page.getByText('Eurovision Song Contest').click();
  await page.getByRole('cell', { name: 'Lunch break' }).click();
  await page.getByRole('cell', { name: 'Albania' }).click();
  await page.getByRole('cell', { name: 'Latvia' }).click();
  await page.getByRole('cell', { name: 'Lithuania' }).click();

  // From here we test the CSV download feature
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('cuesheet').getByText('Export CSV').click();

  function validateCSV(contents: string) {
    // We should try to keep this in sync with the implementation over at cuesheetUtils.ts
    const expectedHeader = ['Project title: Eurovision Song Contest', 'Project description: Turin 2022'];
    const expectedColumns = [
      'Time Start',
      'Time End',
      'Event Title',
      'Presenter Name',
      'Event Subtitle',
      'Public',
      'Note',
      'Colour',
      'End Action',
      'Timer Type',
      'Skip',
      'user0',
      'user1',
      'user2',
      'user3',
      'user4',
      'user5',
      'user6',
      'user7',
      'user8',
      'user9',
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
