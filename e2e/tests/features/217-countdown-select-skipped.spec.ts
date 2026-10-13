import { expect, test } from '../fixtures/override';

test('countdown selection shows skipped event indicator', async ({ context }) => {
  const editorPage = await context.newPage();
  const countdownPage = await context.newPage();

  await editorPage.goto('/editor');
  await countdownPage.goto('/countdown');

  // clear rundown
  await editorPage.getByRole('button', { name: 'Edit' }).click();
  await editorPage.getByRole('button', { name: 'Rundown menu' }).click();
  await editorPage.getByRole('menuitem', { name: 'Clear all' }).click();
  await editorPage.getByRole('button', { name: 'Delete all' }).click();
  await expect(editorPage.getByTestId('rundown-event')).toHaveCount(0);

  // create two events
  await editorPage.getByRole('button', { name: 'Create Event' }).click();
  await expect(editorPage.getByTestId('rundown-event')).toHaveCount(1);
  await editorPage.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await expect(editorPage.getByTestId('rundown-event')).toHaveCount(2);

  // fill data so events are playable
  await editorPage.getByTestId('entry-1').getByTestId('entry__title').fill('Playable');
  await editorPage.getByTestId('entry-1').getByTestId('entry__title').press('Enter');
  await editorPage.getByTestId('entry-2').getByTestId('entry__title').fill('Skipped');
  await editorPage.getByTestId('entry-2').getByTestId('entry__title').press('Enter');

  // mark the second event as skipped via the skip button
  await editorPage.getByTestId('entry-2').getByTestId('rundown-event').click();
  await editorPage.getByTestId('entry-2').getByRole('button', { name: 'Skip event' }).click();

  // open the subscription selector (edit mode)
  await countdownPage.getByRole('button', { name: 'Add' }).click();

  // verify the skipped event shows the "Event is skipped" label
  await expect(countdownPage.getByText('Event is skipped')).toBeVisible();

  // select the skipped event and save
  await countdownPage.getByRole('button', { name: 'Playable' }).click();
  await countdownPage.getByRole('button', { name: 'Skipped' }).click();
  await countdownPage.getByRole('button', { name: 'Save' }).click();

  // verify the skipped event is not shown in the countdown
  await expect(countdownPage.getByText('Playable')).toBeVisible();
  await expect(countdownPage.getByText('Skipped')).not.toBeVisible();
});
