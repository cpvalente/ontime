import { expect, test } from '@playwright/test';
import fs from 'fs';

test('cuesheet displays events and exports csv', async ({ page }) => {
  // ensure elements exist in editor
  await page.goto('http://localhost:4001/editor');
  await page.getByText('First test event').click();
  await page.getByText('Second test event').click();
  await page.getByText('Third test event').click();
  await page.getByText('Add timeSubtract timeApplyCancel').click();
  await page.getByText('Lunch').click();

  // same elements in cuesheet
  await page.goto('http://localhost:4001/cuesheet');
  await page.getByText('All about Carlos demo event').click();
  await page.getByRole('cell', { name: 'First test event' }).click();
  await page.getByRole('cell', { name: 'Second test event' }).click();
  await page.getByRole('cell', { name: 'Third test event' }).click();
  await page.getByRole('cell', { name: '+10 min' }).click();
  await page.getByRole('cell', { name: 'Lunch' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('cuesheet').getByText('Export').click();
  await page.getByText('CSV').click();

  // From here we test the CSV download feature

  function validateCSV(contents) {
    // We should try to keep this in sync with the implementation over at cuesheetUtils.ts
    const expectedHeader = ['All about Carlos demo event', 'www.getontime.no'];
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
    const expectedValues = ['First test event', 'Second test event', 'Third test event', 'Lunch'];

    const allExpected = [...expectedHeader, ...expectedColumns, ...expectedValues];
    return allExpected.every((value) => contents.includes(value));
  }

  const download = await downloadPromise;
  const contents = await fs.promises.readFile(await download.path(), 'utf-8');
  expect(contents).toContain('All about Carlos demo event');
  expect(validateCSV(contents)).toBe(true);
});
