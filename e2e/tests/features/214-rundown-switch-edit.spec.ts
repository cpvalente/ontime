import { expect, test } from '@playwright/test';

test('switching rundowns preserves edits per rundown', async ({ page }) => {
  const suffix = Date.now();
  const nameA = `Rundown A ${suffix}`;
  const nameB = `Rundown B ${suffix}`;

  await page.goto('/editor');

  await expect(page.getByTestId('editor-container')).toBeVisible();

  const editButton = page.getByRole('button', { name: 'Edit' }).first();
  await editButton.click();

  // open manage rundowns and create Rundown A
  await page.getByRole('button', { name: 'Rundown menu' }).click();
  await page.getByRole('menuitem', { name: 'Manage Rundowns...' }).click();

  await page.getByRole('heading', { name: 'Manage project rundowns' }).getByRole('button', { name: 'New' }).click();
  await page.getByPlaceholder('Your rundown name').fill(nameA);
  await page.getByRole('button', { name: 'Create rundown' }).click();
  await expect(page.getByRole('row', { name: nameA })).toBeVisible();

  // load Rundown A
  await page.getByRole('row', { name: nameA }).getByRole('button').click();
  await page.getByRole('menuitem', { name: 'Load', exact: true }).click();
  await page.getByRole('button', { name: 'Load rundown' }).click();
  await expect(page.getByRole('row', { name: nameA }).getByText('Loaded')).toBeVisible();

  // close settings and add an event to Rundown A
  await page.getByRole('button', { name: 'Close settings' }).click();
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByTestId('entry-1').getByTestId('entry__title').fill('Event in rundown A');
  await page.getByTestId('entry-1').getByTestId('entry__title').press('Enter');

  // open manage rundowns and create Rundown B
  await page.getByRole('button', { name: 'Rundown menu' }).click();
  await page.getByRole('menuitem', { name: 'Manage Rundowns...' }).click();

  await page.getByRole('heading', { name: 'Manage project rundowns' }).getByRole('button', { name: 'New' }).click();
  await page.getByPlaceholder('Your rundown name').fill(nameB);
  await page.getByRole('button', { name: 'Create rundown' }).click();
  await expect(page.getByRole('row', { name: nameB })).toBeVisible();

  // load Rundown B
  await page.getByRole('row', { name: nameB }).getByRole('button').click();
  await page.getByRole('menuitem', { name: 'Load', exact: true }).click();
  await page.getByRole('button', { name: 'Load rundown' }).click();
  await expect(page.getByRole('row', { name: nameB }).getByText('Loaded')).toBeVisible();

  // close settings and add an event to Rundown B
  await page.getByRole('button', { name: 'Close settings' }).click();
  await expect(page.getByTestId('rundown-event')).toHaveCount(0);
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByTestId('entry-1').getByTestId('entry__title').fill('Event in rundown B');
  await page.getByTestId('entry-1').getByTestId('entry__title').press('Enter');

  // switch back to Rundown A and verify its event is preserved
  await page.getByRole('button', { name: 'Rundown menu' }).click();
  await page.getByRole('menuitem', { name: 'Manage Rundowns...' }).click();
  await page.getByRole('row', { name: nameA }).getByRole('button').click();
  await page.getByRole('menuitem', { name: 'Load', exact: true }).click();
  await page.getByRole('button', { name: 'Load rundown' }).click();
  await page.getByRole('button', { name: 'Close settings' }).click();

  await expect(page.getByTestId('entry-1').getByTestId('entry__title')).toHaveValue('Event in rundown A');
  await expect(page.getByTestId('rundown-event')).toHaveCount(1);

  // switch back to Rundown B and verify its event is preserved
  await page.getByRole('button', { name: 'Rundown menu' }).click();
  await page.getByRole('menuitem', { name: 'Manage Rundowns...' }).click();
  await page.getByRole('row', { name: nameB }).getByRole('button').click();
  await page.getByRole('menuitem', { name: 'Load', exact: true }).click();
  await page.getByRole('button', { name: 'Load rundown' }).click();
  await page.getByRole('button', { name: 'Close settings' }).click();

  await expect(page.getByTestId('entry-1').getByTestId('entry__title')).toHaveValue('Event in rundown B');
  await expect(page.getByTestId('rundown-event')).toHaveCount(1);
});
