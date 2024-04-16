import { test } from '@playwright/test';

test('message control sends messages to screens', async ({ context }) => {
  const editorPage = await context.newPage();
  const featurePage = await context.newPage();

  await editorPage.goto('http://localhost:4001/messagecontrol');

  // lower third message
  await editorPage.getByPlaceholder('Shown in lower third').click();
  await editorPage.getByPlaceholder('Shown in lower third').fill('testing lower');
  await editorPage.getByRole('button', { name: /toggle lower third message/i }).click();

  await featurePage.goto('http://localhost:4001/lower?trigger=manual&bottom-src=lowerMsg');
  await featurePage.waitForLoadState('load', { timeout: 5000 });
  await featurePage.getByText('testing lower').click({ timeout: 5000 });

  // stage timer message
  await editorPage.getByPlaceholder('Timer').click();
  await editorPage.getByPlaceholder('Timer').fill('testing stage');
  await editorPage.getByRole('button', { name: /toggle timer/i }).click({ timeout: 5000 });

  await featurePage.goto('http://localhost:4001/timer');
  await featurePage.waitForLoadState('load', { timeout: 5000 });
  await featurePage.getByText('testing stage').click();
});
