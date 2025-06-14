import { test, expect } from '../../fixtures/override';
import { TEST_USER_ID_ADMIN } from '../../../src/common/utils/testing';
import { SEED_EVENT_A, SEED_PROJECT_A } from '../../../prisma/seed/standardSeed';

test.describe('[FEAT] Rich Text Editor in Event Note', () => {
  test.beforeEach(async ({ page, loginByUserId }) => {
    // Login as admin user (or any user who can edit events)
    await loginByUserId(TEST_USER_ID_ADMIN);
    // Navigate to the cuesheet for a known project
    await page.goto(`/project/${SEED_PROJECT_A.id}/cuesheet`);
    // Wait for cuesheet to be ready (e.g., for events to load)
    await expect(page.locator('div[data-testid^="cue-row-"]')).toHaveCountGreaterThanOrEqual(1);
  });

  test('should allow rich text editing for event notes', async ({ page }) => {
    // 1. Open an existing event to edit
    // Assuming SEED_EVENT_A is visible on the cuesheet
    const eventRowLocator = page.locator(`div[data-testid="cue-row-${SEED_EVENT_A.id}"]`);
    await eventRowLocator.click();

    // Wait for the event editor modal to appear
    // Looking for a common element in the editor, e.g., the cue input or title input.
    // The title input for SEED_EVENT_A has a specific test id pattern from other tests.
    await expect(page.locator(`input[data-testid="input-textfield-cue-${SEED_EVENT_A.id}"]`)).toBeVisible();

    // 2. Activate Rich Text Editor for 'Note' Field
    // The note field is initially a placeholder div.
    // Its value is SEED_EVENT_A.note
    // The RichTextEditor component's placeholder div has:
    // - onClick/onFocus to activate
    // - style: border: '1px solid #ccc', padding: '10px', minHeight: '50px', cursor: 'text'
    // - role="textbox" (added in tests for RTL, might be present)
    // - aria-placeholder="Click to edit..."
    // Let's try to locate it by its initial text content or a combination of properties.
    // The label "Note" is above it.
    const noteLabel = page.locator('label:has-text("Note")');
    const notePlaceholder = noteLabel.locator('+ div[style*="cursor: text"]'); // Sibling div with cursor: text style

    await expect(notePlaceholder).toBeVisible();
    if (SEED_EVENT_A.note) {
      await expect(notePlaceholder).toHaveText(SEED_EVENT_A.note);
    } else {
      await expect(notePlaceholder).toHaveText('Click to edit...');
    }

    await notePlaceholder.click(); // Activate the editor

    // Verify the toolbar is now visible
    // Toolbar buttons: Bold, Link, Color, BG Color
    const boldButton = page.locator('button:has-text("B")'); // Simple locator for now
    const linkButton = page.locator('button:has-text("Link")');
    const colorButton = page.locator('button:has-text("Color")');
    const bgColorButton = page.locator('button:has-text("BG Color")');

    await expect(boldButton).toBeVisible();
    await expect(linkButton).toBeVisible();
    await expect(colorButton).toBeVisible();
    await expect(bgColorButton).toBeVisible();

    // Locate the ContentEditable area (it's a div with style min-height: '150px')
    const editorContentArea = page.locator('div[contenteditable="true"]');
    await expect(editorContentArea).toBeVisible();
    await expect(editorContentArea).toBeFocused();

    // Clear existing note content (if any) to type fresh
    // This can be done by selecting all and deleting, or Lexical's CLEAR_EDITOR_COMMAND
    // For E2E, page.keyboard.press('Control+A') then page.keyboard.press('Delete') is common.
    await editorContentArea.press('Control+A'); // or 'Meta+A' on macOS
    await editorContentArea.press('Delete');
    await expect(editorContentArea).toHaveText('');


    // 3. Test Bold Functionality
    const boldText = 'This text will be bold.';
    await editorContentArea.type(boldText);
    await editorContentArea.selectText(); // Select the typed text
    await boldButton.click();
    // Verify bold: Lexical usually wraps bold text in a span with font-weight: bold or a <strong> tag.
    // Let's assume span with style for now.
    await expect(editorContentArea.locator('span[style*="font-weight: bold;"]')).toHaveText(boldText);
    // Or if it uses <strong>: await expect(editorContentArea.locator('strong')).toHaveText(boldText);

    // Clear for next test
    await editorContentArea.press('Control+A');
    await editorContentArea.press('Delete');

    // 4. Test Link Functionality
    const linkText = 'This is a link';
    const testUrl = 'https://example.com';
    page.on('dialog', dialog => dialog.accept(testUrl)); // Handle prompt
    await editorContentArea.type(linkText);
    await editorContentArea.selectText();
    await linkButton.click();
    // Verify link: Check for an <a> tag
    const linkElement = editorContentArea.locator(`a[href="${testUrl}"]`);
    await expect(linkElement).toBeVisible();
    await expect(linkElement).toHaveText(linkText);
    page.off('dialog', () => {}); // Remove listener if it's a one-time thing per action

    // Clear for next test
    await editorContentArea.press('Control+A');
    await editorContentArea.press('Delete');

    // 5. Test Text Color Functionality
    const colorText = 'This text is red';
    const redColor = 'rgb(255, 0, 0)';
    page.on('dialog', dialog => dialog.accept(redColor)); // Handle prompt
    await editorContentArea.type(colorText);
    await editorContentArea.selectText();
    await colorButton.click();
    // Verify text color
    await expect(editorContentArea.locator(`span[style*="color: ${redColor};"]`)).toHaveText(colorText);
    page.off('dialog', () => {});

    // Clear for next test
    await editorContentArea.press('Control+A');
    await editorContentArea.press('Delete');

    // 6. Test Background Color Functionality
    const bgColorText = 'This text has yellow background';
    const yellowBgColor = 'rgb(255, 255, 0)';
    page.on('dialog', dialog => dialog.accept(yellowBgColor)); // Handle prompt
    await editorContentArea.type(bgColorText);
    await editorContentArea.selectText();
    await bgColorButton.click();
    // Verify background color
    await expect(editorContentArea.locator(`span[style*="background-color: ${yellowBgColor};"]`)).toHaveText(bgColorText);
    page.off('dialog', () => {});


    // 7. Save and Verify
    // Combine some formatting for the save test
    await editorContentArea.press('Control+A');
    await editorContentArea.press('Delete');

    const finalNoteText = "Final Note: Bold, Link, and Red.";
    await editorContentArea.type(finalNoteText);

    // Apply Bold to "Bold"
    await editorContentArea.press('Home'); // Go to start
    for(let i=0; i < "Final Note: ".length; i++) await page.keyboard.press('ArrowRight'); // Move cursor
    await page.keyboard.down('Shift');
    for(let i=0; i < "Bold".length; i++) await page.keyboard.press('ArrowRight'); // Select "Bold"
    await page.keyboard.up('Shift');
    await boldButton.click();

    // Apply Link to "Link" (re-register dialog handler)
    page.on('dialog', dialog => dialog.accept(testUrl));
    await editorContentArea.press('End'); // Go to end
    for(let i=0; i < ", and Red.".length; i++) await page.keyboard.press('ArrowLeft');
    await page.keyboard.down('Shift');
    for(let i=0; i < "Link".length; i++) await page.keyboard.press('ArrowLeft');
    await page.keyboard.up('Shift');
    await linkButton.click();
    page.off('dialog', () => {});

    // Apply Red color to "Red" (re-register dialog handler)
    page.on('dialog', dialog => dialog.accept(redColor));
    await editorContentArea.press('End');
    await page.keyboard.press('ArrowLeft'); // for the dot
    await page.keyboard.down('Shift');
    for(let i=0; i < "Red".length; i++) await page.keyboard.press('ArrowLeft');
    await page.keyboard.up('Shift');
    await colorButton.click();
    page.off('dialog', () => {});

    // Click save button in the event editor
    // Assuming a common save button testid or text
    const saveButton = page.locator('button:has-text("Save")'); // Or a more specific selector
    await saveButton.click();

    // Wait for modal to close (e.g., the save button is no longer visible)
    await expect(saveButton).not.toBeVisible();
    // Or check that the cuesheet is active again
    await expect(page.locator('div[data-testid^="cue-row-"]')).toHaveCountGreaterThanOrEqual(1);

    // Re-open the same event
    await eventRowLocator.click();
    await expect(page.locator(`input[data-testid="input-textfield-cue-${SEED_EVENT_A.id}"]`)).toBeVisible(); // Wait for editor

    // Activate the note editor again
    const persistedNotePlaceholder = noteLabel.locator('+ div[style*="cursor: text"]');
    await persistedNotePlaceholder.click();

    const persistedEditorContentArea = page.locator('div[contenteditable="true"]');
    await expect(persistedEditorContentArea).toBeVisible();

    // Verify persisted content
    // This is the most complex part, as the exact HTML structure needs to be known.
    // Example: Check for bold part
    await expect(persistedEditorContentArea.locator('span[style*="font-weight: bold;"]')).toContainText("Bold");
    // Example: Check for link part
    await expect(persistedEditorContentArea.locator(`a[href="${testUrl}"]`)).toContainText("Link");
    // Example: Check for colored part
    await expect(persistedEditorContentArea.locator(`span[style*="color: ${redColor};"]`)).toContainText("Red");

    // Overall text check might be too simple if HTML is involved, but good for a basic check
    // await expect(persistedEditorContentArea).toContainText("Final Note: Bold, Link, and Red.");
    // A more robust check would be to get the innerHTML and parse it or use snapshot testing.

    // Close the editor (e.g., click cancel or save again)
    const cancelButton = page.locator('button:has-text("Cancel")'); // Or a more specific selector
    await cancelButton.click();
    await expect(cancelButton).not.toBeVisible();
  });
});
