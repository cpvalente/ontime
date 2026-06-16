import { expect, test } from '@playwright/test';

test('cuesheet displays events', async ({ page }) => {
  await page.goto('/cuesheet');
  await expect(page.getByTestId('cuesheet')).toBeVisible();
  await expect(page.getByTestId('cuesheet-event').first()).toBeVisible();
});

test('cuesheet datagrid does not submit timer cells on tab-out or escape', async ({ page }) => {
  await page.goto('/cuesheet');

  const firstEvent = page.getByTestId('cuesheet-event').first();
  await expect(firstEvent).toBeVisible();

  const durationCell = firstEvent.getByTestId('cuesheet-cell-duration');

  /**
   * 1. Tab out of a timer cell should not submit the typed value
   */
  await durationCell.click();
  const durationInput = durationCell.locator('input');
  await expect(durationInput).toBeVisible();
  const originalDuration = await durationInput.inputValue();

  await durationInput.fill('01:00:00');
  await durationInput.press('Tab');

  // cell should exit edit mode without submitting
  await expect(durationInput).not.toBeVisible();

  // re-enter edit mode: original value should be unchanged
  await durationCell.click();
  await expect(durationCell.locator('input')).toHaveValue(originalDuration);
  await durationCell.locator('input').press('Escape');

  /**
   * 2. Escape on a timer cell should not submit, should revert to original value
   */
  await durationCell.click();
  await expect(durationCell.locator('input')).toBeVisible();

  await durationCell.locator('input').fill('02:00:00');
  await durationCell.locator('input').press('Escape');

  // cell should exit edit mode without submitting
  await expect(durationCell.locator('input')).not.toBeVisible();

  // re-enter edit mode: original value should be unchanged
  await durationCell.click();
  await expect(durationCell.locator('input')).toHaveValue(originalDuration);
  await durationCell.locator('input').press('Escape');
});

test('cuesheet datagrid keeps keyboard focus flow while editing text cells', async ({ page }) => {
  await page.goto('/cuesheet');

  const firstEvent = page.getByTestId('cuesheet-event').first();
  await expect(firstEvent).toBeVisible();

  const cueEditor = firstEvent.getByTestId('cuesheet-editor-cue');
  const titleEditor = firstEvent.getByTestId('cuesheet-editor-title');
  const noteEditor = firstEvent.getByTestId('cuesheet-editor-note');

  /**
   * 1. focus a cell in the datagrid single line text
   * submitting the data returns the focus to the parent
   */
  await titleEditor.click();
  await expect(titleEditor).toBeFocused();
  const updatedTitle = `focus-title-${Date.now()}`;
  await titleEditor.fill(updatedTitle);
  await titleEditor.press('Enter');
  await expect(titleEditor).not.toBeFocused();
  await expect(titleEditor).toHaveValue(updatedTitle);

  /**
   * 2. navigate and modify multiline text cell
   * submitting works with ctrl/cmd + enter and the focus returns to the parent
   */
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(noteEditor).toBeFocused();
  const updatedNote = `focus-note-${Date.now()}`;
  await noteEditor.fill(updatedNote);
  await noteEditor.press('ControlOrMeta+Enter');
  await expect(noteEditor).not.toBeFocused();
  await expect(noteEditor).toHaveValue(updatedNote);

  /**
   * 2. navigate and modify single line text cell again
   * pressing escape cancels the edit and the focus returns to the parent
   */
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await expect(titleEditor).toBeFocused();
  const cueBeforeCancel = await cueEditor.inputValue();
  await cueEditor.click();
  await cueEditor.fill(`${cueBeforeCancel} temporary`);
  await cueEditor.press('Escape');
  await expect(cueEditor).not.toBeFocused();
  await expect(cueEditor).toHaveValue(cueBeforeCancel);
});

test('cuesheet background edit from empty state', async ({ page }) => {
  // create an empty rundown
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Toggle settings' }).click();
  await page.getByRole('button', { name: 'Manage rundowns' }).click();
  await page.getByRole('button', { name: 'New' }).nth(1).click();
  const emptyName = `empty-${Date.now()}`;
  await page.getByRole('textbox', { name: 'Rundown title' }).fill(emptyName);
  await page.getByRole('button', { name: 'Create rundown' }).click();

  // edit it in the cuesheet
  await page.getByRole('row', { name: '0 empty-' }).getByTestId('rundown_menu').click();
  await page.getByText('Edit in cuesheet').click();

  // expect to see and empty screen
  await expect(page.getByRole('button', { name: 'Create Event' })).toBeVisible();

  // create 1 event
  await page.getByRole('button', { name: 'Create Event' }).click();

  // and expect to find it
  await expect(page.getByTestId('cuesheet-event')).toBeVisible();
});
