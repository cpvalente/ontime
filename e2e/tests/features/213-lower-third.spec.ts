import { expect, test } from '@playwright/test';

test('show warning when event crosses midnight', async ({ context }) => {
  const editorPage = await context.newPage();
  editorPage.goto('http://localhost:4001/editor');

  await editorPage.getByRole('button', { name: 'Clear rundown' }).click();
  await editorPage.getByRole('button', { name: 'Delete all' }).click();

  await editorPage.getByRole('button', { name: 'Create Event' }).click();
  await editorPage.getByRole('button', { name: 'Event' }).nth(4).click();
  await editorPage.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await editorPage.getByTestId('entry-1').getByTestId('block__title').fill('T 1');
  await editorPage.getByTestId('entry-1').getByTestId('block__title').press('Enter');

  const lowerPage = await context.newPage();
  lowerPage.goto('http://localhost:4001/lower/?bottom-src=note&transition=0');

  await expect(lowerPage.getByTestId('l3-top')).toBeHidden();

  await editorPage.getByTestId('entry-1').getByLabel('Start event').click();

  await expect(lowerPage.getByTestId('l3-top')).toContainText('T 1');
});
