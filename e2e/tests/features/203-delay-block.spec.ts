import { expect, test } from '@playwright/test';

test('delay blocks add time to events', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  // delete all events and add a new one
  await page.getByRole('button', { name: 'Event...' }).click();
  await page.getByRole('menuitem', { name: 'Delete all events' }).click();
  await page.getByRole('button', { name: 'Event...' }).click();
  await page.getByRole('menuitem', { name: 'Add event at start' }).click();

  // add data to new event
  await page.getByTestId('panel-rundown').getByPlaceholder('Start').click();
  await page.getByTestId('panel-rundown').getByPlaceholder('Start').fill('10m');
  await page.getByTestId('panel-rundown').getByPlaceholder('Start').press('Enter');
  await page.getByTestId('panel-rundown').getByPlaceholder('End').click();
  await page.getByTestId('panel-rundown').getByPlaceholder('End').fill('20m');
  await page.getByTestId('panel-rundown').getByPlaceholder('End').press('Enter');

  // add delay block
  await page.getByRole('button', { name: 'Event...' }).click();
  await page.getByRole('menuitem', { name: 'Add delay at start' }).click();

  // fill positive delay
  await page.getByTestId('delay-input').click();
  await page.getByTestId('delay-input').fill('2m');
  await page.getByTestId('delay-input').press('Enter');
  await page.getByText('+2 minNew start: 00:12:00').click();

  // make negative delay
  await page.getByText('Subtract time').click();
  await page.getByText('-2 minNew start: 00:08:00').click();

  // apply delay
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByTestId('panel-rundown').getByTestId('time-input-timeStart')).toHaveValue('00:08:00');

  // add new delay
  await page.getByTestId('panel-rundown').getByPlaceholder('Start').click();
  await page.getByRole('button', { name: 'Event...' }).click();
  await page.getByRole('menuitem', { name: 'Add delay at start' }).click();
  await page.getByTestId('delay-input').click();
  await page.getByTestId('delay-input').fill('10m');
  await page.getByTestId('delay-input').press('Enter');
  await page.getByText('+10 minNew start: 00:18:00').click();

  // cancel delay
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByTestId('panel-rundown').getByTestId('time-input-timeStart')).toHaveValue('00:08:00');
  await expect(page.getByText('+10 minNew start: 00:18:00')).toHaveCount(0);
});

test('delays are show correctly', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  // add a test event
  await page.getByRole('button', { name: 'Event...' }).click();
  await page.getByRole('menuitem', { name: 'Delete all events' }).click();
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByTestId('time-input-timeStart').click();
  await page.getByTestId('panel-rundown').getByTestId('time-input-timeStart').click();
  await page.getByTestId('panel-rundown').getByTestId('time-input-timeStart').fill('10');
  await page.getByTestId('panel-rundown').getByTestId('time-input-timeStart').press('Enter');
  await page.getByTestId('panel-rundown').getByTestId('time-input-timeEnd').click();
  await page.getByTestId('panel-rundown').getByTestId('time-input-timeEnd').fill('20');
  await page.getByTestId('panel-rundown').getByTestId('time-input-timeEnd').press('Enter');
  await page.getByText('Event title').click();
  await page.getByPlaceholder('Event title').fill('test');
  await page.getByPlaceholder('Event title').press('Enter');

  await page.getByText('SED').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Toggle public' }).click();

  // add a delay
  await page.getByRole('button', { name: 'Event...' }).click();
  await page.getByRole('menuitem', { name: 'Add delay at start' }).click();
  await page.getByTestId('delay-input').click();
  await page.getByTestId('delay-input').fill('1');
  await page.getByTestId('delay-input').press('Enter');

  // delay is shown in the editor
  await page.getByText('+1 minNew start: 00:11:00').click();

  // delay is shown in the cuesheet
  await page.goto('http://localhost:4001/cuesheet');
  await page.getByRole('cell', { name: '+1 min' }).click();

  // delay is NOT shown in the public view
  await page.goto('http://localhost:4001/public');
  await page.getByText('00:10 → 00:20').click();

  // delay is shown in the backstage view
  await page.goto('http://localhost:4001/backstage');
  await page.getByText('00:11 → 00:21').click();
});
