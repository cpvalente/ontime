import { expect, test } from '@playwright/test';

test('Editing multiple events', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Edit' }).click();

  // clear rundown
  await page.getByRole('button', { name: 'Rundown menu' }).click();
  await page.getByRole('menuitem', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  // create two events with distinct titles
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await expect(page.getByTestId('rundown-event')).toHaveCount(2);

  await page.getByTestId('entry-1').getByTestId('entry__title').fill('first');
  await page.getByTestId('entry-1').getByTestId('entry__title').press('Enter');
  await page.getByTestId('entry-2').getByTestId('entry__title').fill('second');
  await page.getByTestId('entry-2').getByTestId('entry__title').press('Enter');

  const editor = page.getByTestId('editor-container');

  // a single selection shows the schedule and the event id
  await page.getByTestId('entry-1').getByTestId('rundown-event').click();
  await expect(editor.getByText('Event schedule')).toBeVisible();
  await expect(editor.getByLabel('Title', { exact: true })).toHaveValue('first');

  // selecting both events shows a merged view
  await page
    .getByTestId('entry-2')
    .getByTestId('rundown-event')
    .click({ modifiers: ['Shift'] });
  await expect(editor.locator('#eventId')).toHaveValue('2 events selected');
  await expect(editor.getByText('Event schedule')).toBeHidden();
  await expect(editor.getByText('Automations are not available when editing multiple events')).toBeVisible();

  // fields which do not agree are shown as mixed
  const title = editor.getByLabel('Title', { exact: true });
  await expect(title).toHaveValue('');
  await expect(title).toHaveAttribute('placeholder', 'Mixed');

  // leaving a mixed field without editing it does not overwrite the events
  await title.click();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('entry-1').getByTestId('entry__title')).toHaveValue('first');
  await expect(page.getByTestId('entry-2').getByTestId('entry__title')).toHaveValue('second');

  // editing a field applies it to the whole selection
  await title.fill('shared title');
  await title.press('Enter');
  await expect(page.getByTestId('entry-1').getByTestId('entry__title')).toHaveValue('shared title');
  await expect(page.getByTestId('entry-2').getByTestId('entry__title')).toHaveValue('shared title');

  // the value is no longer mixed
  await expect(editor.getByLabel('Title', { exact: true })).toHaveValue('shared title');

  // going back to a single selection restores the full editor
  await page.getByTestId('entry-1').getByTestId('rundown-event').click();
  await expect(editor.getByText('Event schedule')).toBeVisible();
  await expect(editor.locator('#eventId')).not.toHaveValue('2 events selected');
});
