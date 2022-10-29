import { expect, test } from '@playwright/test';

test('test', async ({ context }) => {
  const editorPage = await context.newPage();
  const featurePage = await context.newPage();

  await editorPage.goto('http://localhost:4001/messagecontrol');

  // stage timer message
  await editorPage.getByPlaceholder('Shown in stage timer').click();
  await editorPage.getByPlaceholder('Shown in stage timer').fill('testing');
  await editorPage.getByRole('button', { name: 'toggle timer screen message' }).click();

  await featurePage.goto('http://localhost:4001/timer');
  await featurePage.getByText('testing').click();

  // public screen message
  await editorPage.getByPlaceholder('Shown in public screens').click();
  await editorPage.getByPlaceholder('Shown in public screens').fill('testing public');
  await editorPage.getByRole('button', { name: /toggle public screen message/i }).click();

  await featurePage.goto('http://localhost:4001/public');
  await featurePage.getByText('testing public').click();

  // lower third message
  await editorPage.getByPlaceholder('Shown in lower third').click();
  await editorPage.getByPlaceholder('Shown in lower third').fill('testing lower');
  await editorPage.getByRole('button', { name: /toggle lower third message/i }).click();
  await featurePage.goto('http://localhost:4001/lower');
  await featurePage.getByText('testing lower').click();

  // on air state
  await editorPage.getByRole('button', { name: 'Toggle On Air' }).click();
  await featurePage.goto('http://localhost:4001/studio');
  await featurePage.getByText('ON AIR').click();
  const onAirActive = await featurePage.locator('data-testid=on-air-enabled');
  await expect(onAirActive).toHaveText(/on air/i);
});
