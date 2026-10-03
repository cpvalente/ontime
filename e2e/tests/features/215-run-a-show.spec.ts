import { expect, test } from '../fixtures/override';

test('operator runs a show from the editor and the output views follow', async ({ context }) => {
  const editor = await context.newPage();
  const timer = await context.newPage();
  const backstage = await context.newPage();

  await editor.goto('/editor');

  // build a rundown with three events
  await editor.getByRole('button', { name: 'Edit' }).click();
  await editor.getByRole('button', { name: 'Rundown menu' }).click();
  await editor.getByRole('menuitem', { name: 'Clear all' }).click();
  await editor.getByRole('button', { name: 'Delete all' }).click();
  await expect(editor.getByTestId('rundown-event')).toHaveCount(0);

  await editor.getByRole('button', { name: 'Create Event' }).click();
  await editor.getByTestId('entry-1').getByTestId('entry__title').fill('Opening');
  await editor.getByTestId('entry-1').getByTestId('entry__title').press('Enter');
  await editor.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await editor.getByTestId('entry-2').getByTestId('entry__title').fill('Keynote');
  await editor.getByTestId('entry-2').getByTestId('entry__title').press('Enter');
  await editor.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await editor.getByTestId('entry-3').getByTestId('entry__title').fill('Closing');
  await editor.getByTestId('entry-3').getByTestId('entry__title').press('Enter');
  await expect(editor.getByTestId('rundown-event')).toHaveCount(3);

  await timer.goto('/timer');
  await backstage.goto('/backstage');

  const timerControl = editor.getByTestId('panel-timer-control');

  // nothing is loaded before the show starts
  await expect(timer.locator('.event.now')).toHaveCount(0);
  await expect(backstage.locator('.event.now')).toHaveCount(0);

  // Start runs the first event and the views show what is now and next
  await timerControl.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(editor.getByTestId('entry-1').getByTestId('rundown-event')).toHaveAttribute('data-running');
  await expect(timer.locator('.event.now')).toContainText('Opening');
  await expect(timer.locator('.event.next')).toContainText('Keynote');
  await expect(backstage.locator('.event.now')).toContainText('Opening');

  // pausing is shown in the timer view, and resuming clears it
  await editor.getByTestId('entry-1').getByLabel('Pause event').click();
  await expect(timer.locator('.timer')).toHaveClass(/timer--paused/);
  await editor.getByTestId('entry-1').getByLabel('Start event').click();
  await expect(timer.locator('.timer')).not.toHaveClass(/timer--paused/);

  // Next moves the show forward
  await timerControl.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(editor.getByTestId('entry-2').getByTestId('rundown-event')).toHaveAttribute('data-running');
  await expect(timer.locator('.event.now')).toContainText('Keynote');
  await expect(timer.locator('.event.next')).toContainText('Closing');
  await expect(backstage.locator('.event.now')).toContainText('Keynote');

  // in the last event there is nothing next, and the operator can finish the show
  await timerControl.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(timer.locator('.event.now')).toContainText('Closing');
  await expect(timer.locator('.event.next')).toHaveCount(0);
  await expect(timerControl.getByRole('button', { name: 'Finish', exact: true })).toBeVisible();

  // finishing stops playback and clears the views
  await timerControl.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(timerControl.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
  await expect(timer.locator('.event.now')).toHaveCount(0);
  await expect(backstage.locator('.event.now')).toHaveCount(0);
});
