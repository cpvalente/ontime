import { expect, test } from '@playwright/test';

test('cuesheet displays events', async ({ page }) => {
  await page.goto('/cuesheet');
  await expect(page.getByTestId('cuesheet')).toBeVisible();
  await expect(page.getByTestId('cuesheet-event').first()).toBeVisible();
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
