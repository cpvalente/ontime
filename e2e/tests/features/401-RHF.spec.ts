import { expect, test } from '../fixtures/override';

test('Stale data in RHF in settings', async ({ context }) => {
  const editorPage_1 = await context.newPage();
  const editorPage_2 = await context.newPage();

  await editorPage_1.goto('/editor?settings=settings__data');
  await editorPage_2.goto('/editor?settings=settings__data');

  const value_1 = 'ABCD';

  await editorPage_1.getByRole('textbox', { name: 'Project title' }).click();
  await editorPage_1.getByRole('textbox', { name: 'Project title' }).fill(value_1);
  await editorPage_1.getByRole('textbox', { name: 'Project title' }).press('Enter');

  await expect(editorPage_1.getByRole('textbox', { name: 'Project title' })).toHaveValue(value_1);
  await expect(editorPage_2.getByRole('textbox', { name: 'Project title' })).toHaveValue(value_1);

  const value_2 = 'XYZ2';

  await editorPage_1.getByRole('textbox', { name: 'Project title' }).click();
  await editorPage_1.getByRole('textbox', { name: 'Project title' }).fill(value_2);
  await editorPage_1.getByRole('textbox', { name: 'Project title' }).press('Enter');

  await expect(editorPage_1.getByRole('textbox', { name: 'Project title' })).toHaveValue(value_2);
  await expect(editorPage_2.getByRole('textbox', { name: 'Project title' })).toHaveValue(value_2);
});
