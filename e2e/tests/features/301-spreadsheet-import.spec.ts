import { expect, test, type Page } from '@playwright/test';

const fileToUpload = 'e2e/tests/fixtures/Ontime rundown template v4.xlsx';

test('imports spreadsheet and applies imported rundown to editor', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Edit' }).click();

  // clear the rundown
  await page.getByRole('button', { name: 'Rundown menu' }).click();
  await page.getByRole('menuitem', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();
  await expect(page.getByTestId('rundown-event')).toHaveCount(0);

  // open the spreadsheet
  await page.getByRole('button', { name: 'Toggle settings' }).click();
  await page.getByRole('button', { name: 'Project settings' }).click();
  await page.getByRole('button', { name: 'Import spreadsheet' }).first().click();
  await expect(page.getByText('Synchronise your rundown with an external source')).toBeVisible();

  // upload the spreadsheet
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import from spreadsheet', exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(fileToUpload);
  const worksheetSelect = page.getByRole('combobox', { name: 'Worksheet', exact: true });
  await expect(worksheetSelect).toBeVisible();
  await worksheetSelect.click();
  await page.getByRole('option', { name: 'Event schedule advanced' }).click();
  await expect(worksheetSelect).toContainText('Event schedule advanced');

  // apply import
  await page.getByRole('button', { name: 'Preview import' }).click();
  await page.getByRole('button', { name: 'Apply import' }).click();
  await expect(page.getByText('Import complete')).toBeVisible();
  await expect(page.getByText('Spreadsheet data applied.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset flow' }).click();

  // verify the data in the rundown
  await page.getByRole('button', { name: 'Close settings' }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Close settings' }).click();

  await expectGroupSummary(page, {
    title: 'Morning Sessions',
    entries: '5',
    start: '10:00:00',
    end: '12:00:00',
    duration: '2h',
  });
  await expectGroupSummary(page, {
    title: 'Lunch',
    entries: '1',
    start: '12:00:00',
    end: '13:00:00',
    duration: '1h',
  });
  await expectGroupSummary(page, {
    title: 'Afternoon Sessions',
    entries: '4',
    start: '13:00:00',
    end: '14:00:00',
    duration: '1h',
  });

  await expectInputValue(page, 'Lunch / Countdown to next session');

  await expectInputValue(page, '11:30 - House staff setup lunch in lobby');
});

async function expectGroupSummary(
  page: Page,
  {
    title,
    entries,
    start,
    end,
    duration,
  }: { title: string; entries: string; start: string; end: string; duration: string },
) {
  const group = page.getByTestId('rundown-group').filter({ has: page.locator(`input[value="${title}"]`) });

  await expect(group).toHaveCount(1);
  await expect(group).toContainText('Entries');
  await expect(group).toContainText(entries);
  await expect(group).toContainText('Start');
  await expect(group).toContainText(start);
  await expect(group).toContainText('End');
  await expect(group).toContainText(end);
  await expect(group).toContainText('Duration');
  await expect(group).toContainText(duration);
}

async function expectInputValue(page: Page, value: string) {
  await expect(page.locator(`input[value="${value}"]`)).toHaveCount(1);
}
