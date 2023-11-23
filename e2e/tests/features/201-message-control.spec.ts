import { expect, test } from '@playwright/test';

test('message control sends messages to screens', async ({ context }) => {
  const editorPage = await context.newPage();
  const featurePage = await context.newPage();

  await editorPage.goto('http://localhost:4001/messagecontrol');

  // public screen message
  await editorPage.getByPlaceholder('Shown in public and backstage screens').click();
  await editorPage.getByPlaceholder('Shown in public and backstage screens').fill('testing public');
  await editorPage.getByRole('button', { name: 'Toggle Public / Backstage screen message' }).click();

  await featurePage.goto('http://localhost:4001/public');
  await featurePage.waitForLoadState('load', { timeout: 5000 });
  await featurePage.getByText('testing public').click({ timeout: 5000 });

  // lower third message
  await editorPage.getByPlaceholder('Shown in lower third').click();
  await editorPage.getByPlaceholder('Shown in lower third').fill('testing lower');
  await editorPage.getByRole('button', { name: /toggle lower third message/i }).click();

  await featurePage.goto('http://localhost:4001/lower');
  await featurePage.waitForLoadState('load', { timeout: 5000 });
  await featurePage.getByText('testing lower').click({ timeout: 5000 });

  // stage timer message
  await editorPage.getByPlaceholder('Timer').click();
  await editorPage.getByPlaceholder('Timer').fill('testing stage');
  await editorPage.getByRole('button', { name: /toggle timer/i }).click({ timeout: 5000 });

  await featurePage.goto('http://localhost:4001/timer');
  await featurePage.waitForLoadState('load', { timeout: 5000 });
  await featurePage.getByText('testing stage').click();

  // on air state
  await editorPage.getByTestId('toggle on air').click();

  await featurePage.goto('http://localhost:4001/studio');
  await featurePage.getByText('ON AIR').click();
  const onAirActive = await featurePage.locator('data-testid=on-air-enabled');
  await expect(onAirActive).toHaveText(/on air/i);
});
