import { test, expect } from '@playwright/test';

test('smoke test operator', async ({ page }) => {
  // make some boilerplate
  await page.goto('http://localhost:4001/editor');
  await page.getByRole('button', { name: 'Event...' }).click();
  await page.getByRole('menuitem', { name: 'Delete all events' }).click();
  await page.getByRole('button', { name: 'Create Event' }).click();

  await page.getByTestId('time-input-timeStart').fill('1m');
  await page.getByTestId('time-input-timeStart').press('Enter');
  await page.getByTestId('time-input-durationOverride').fill('1m');
  await page.getByTestId('time-input-durationOverride').press('Enter');

  await page.getByText('Start time is last end').click();
  await page.getByTestId('quick-add-event').click();
  await page.getByTestId('entry-2').getByTestId('time-input-durationOverride').fill('1m');
  await page.getByTestId('entry-2').getByTestId('time-input-durationOverride').press('Enter');

  await page.getByText('Start time is last end').click();
  await page.getByTestId('quick-add-event').click();
  await page.getByTestId('entry-3').getByTestId('time-input-durationOverride').fill('1m');
  await page.getByTestId('entry-3').getByTestId('time-input-durationOverride').press('Enter');

  await page.getByRole('button', { name: 'Event...' }).click();
  await page.getByRole('menuitem', { name: 'Add block at start' }).click();
  await page.getByTestId('quick-add-block').click();

  // start an event
  await page.getByTestId('panel-timer-control').getByRole('button', { name: 'Start' }).click();

  await page.goto('http://localhost:4001/op');

  await expect(page.getByText('00:01 - 00:02')).toBeInViewport();
  await expect(page.getByText('00:02 - 00:03')).toBeInViewport();
  await expect(page.getByText('00:03 - 00:04')).toBeInViewport();
});
