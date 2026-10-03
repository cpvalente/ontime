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

test('message control drives the stage screen state', async ({ context }) => {
  const editorPage = await context.newPage();
  const featurePage = await context.newPage();

  await editorPage.goto('/messagecontrol');
  await featurePage.goto('/timer');
  await featurePage.waitForLoadState('load', { timeout: 5000 });

  // the secondary line defaults to an aux timer, the select is what puts our text on screen
  await editorPage.getByPlaceholder('Message shown as secondary text in stage timer').fill('testing secondary');
  await editorPage.getByRole('combobox').click();
  await editorPage.getByRole('option', { name: 'Message' }).click();
  await expect(featurePage.getByText('testing secondary')).toBeVisible();

  await editorPage.getByTestId('toggle timer blackout').click();
  await expect(featurePage.locator('.blackout')).toHaveClass(/blackout--active/);

  // clearing returns the screen to normal, but keeps what the operator typed
  await editorPage.getByTestId('clear screen').click();
  await expect(featurePage.locator('.blackout')).not.toHaveClass(/blackout--active/);
  await expect(featurePage.getByText('testing secondary')).toHaveCount(0);
  await expect(editorPage.getByPlaceholder('Message shown as secondary text in stage timer')).toHaveValue(
    'testing secondary',
  );
});
