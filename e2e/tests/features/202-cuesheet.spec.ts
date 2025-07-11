import { expect, test } from '@playwright/test';

test('cuesheet displays events', async ({ page }) => {
  // same elements in cuesheet
  await page.goto('http://localhost:4001/cuesheet');
  await expect(page.getByText('Eurovision Song Contest')).toBeVisible();
  await expect(page.getByRole('row', { name: 'Lunch break' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'Afternoon break' })).toBeVisible();

  await expect(page.locator('#cuesheet')).toBeVisible();

  // there should be 16 rows in the table (same as the amount of events in the rundown)
  const rowCount = await page.locator('#cuesheet tbody tr').count();
  expect(rowCount).toBe(16);
});

test('cuesheet custom field with Lexical editor', async ({ page }) => {
  await page.goto('http://localhost:4001/cuesheet');

  // Locate a custom field cell. Assuming 'Custom Col 1' is the header for a string custom field.
  // And assuming the first data row is a suitable target.
  // Adjust selectors based on actual table structure and data.
  const customFieldCell = page.locator('#cuesheet tbody tr:first-child td[data-column-id="customCol1"]');

  // 1. Verify initial display (non-editable text)
  // This requires knowing the initial text or checking it's not an input/editor
  await expect(customFieldCell.locator('div[contenteditable="true"]')).not.toBeVisible();
  const initialText = await customFieldCell.innerText();

  // 2. Click to activate editor
  await customFieldCell.click();
  const lexicalEditor = customFieldCell.locator('div[contenteditable="true"]');
  await expect(lexicalEditor).toBeVisible();
  await expect(lexicalEditor).toBeFocused();

  // 3. Edit text
  const newText = 'Updated text via Playwright';
  await lexicalEditor.fill(newText);
  await expect(lexicalEditor).toHaveText(newText);

  // 4. Click outside (or blur) to save
  // Clicking another element to cause blur. A more robust way might be needed depending on implementation.
  await page.getByText('Eurovision Song Contest').click(); // Click title or header
  await expect(lexicalEditor).not.toBeVisible(); // Editor should be gone
  await expect(customFieldCell).toHaveText(newText); // Cell should display new text

  // 5. Verify other cell types are unaffected (optional, good for regression)
  // This would involve locating other cell types and ensuring they didn't change.
  // For example, check a 'Title' cell:
  const titleCell = page.locator('#cuesheet tbody tr:first-child td[data-column-id="title"]');
  await expect(titleCell.locator('div[contenteditable="true"]')).not.toBeVisible(); // Assuming title is not lexical
});
