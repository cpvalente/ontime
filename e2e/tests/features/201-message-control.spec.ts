import { expect, test } from '../fixtures/override';

test('message control sends messages to screens', async ({ context }) => {
  const editorPage = await context.newPage();
  const featurePage = await context.newPage();

  await editorPage.goto('/messagecontrol');
  await featurePage.goto('/timer');

  // the message overlay is always rendered and shown by fading it in
  const messageOverlay = featurePage.locator('.message-overlay');
  await expect(messageOverlay).toHaveCSS('opacity', '0');

  // show a fullscreen message in the timer view
  await editorPage.getByPlaceholder('Message shown fullscreen in stage timer').fill('testing stage');
  await editorPage.getByRole('button', { name: /toggle timer message/i }).click();
  await expect(messageOverlay).toContainText('testing stage');
  await expect(messageOverlay).toHaveCSS('opacity', '1');

  // hiding the message reveals the timer again
  await editorPage.getByRole('button', { name: /toggle timer message/i }).click();
  await expect(messageOverlay).toHaveCSS('opacity', '0');
});
