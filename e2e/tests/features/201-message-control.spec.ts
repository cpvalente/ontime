import { expect, test } from '@playwright/test';

test('message control sends messages to screens', async ({ context }) => {
  const editorPage = await context.newPage();
  const featurePage = await context.newPage();

  await editorPage.goto('http://localhost:4001/messagecontrol');

  // stage timer message
  await editorPage.getByPlaceholder('Message shown fullscreen in stage timer').click();
  await editorPage.getByPlaceholder('Message shown fullscreen in stage timer').fill('testing stage');
  await editorPage.getByRole('button', { name: /toggle timer message/i }).click({ timeout: 5000 });

  await featurePage.goto('http://localhost:4001/timer');
  await featurePage.waitForLoadState('load', { timeout: 5000 });
  await expect(featurePage.getByText('testing stage')).toBeVisible();
});
