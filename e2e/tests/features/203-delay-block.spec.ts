import { expect, test } from '@playwright/test';

test('delay blocks add time to events', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  // delete all events and add a new one
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('button', { name: 'Clear rundown' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();
  await page.getByRole('button', { name: 'Create event' }).click();

  // add data to new event
  await page.getByTestId('rundown').getByPlaceholder('Start').click();
  await page.getByTestId('rundown').getByPlaceholder('Start').fill('10m');
  await page.getByTestId('rundown').getByPlaceholder('Start').press('Enter');
  await page.getByTestId('rundown').getByPlaceholder('Duration').click();
  await page.getByTestId('rundown').getByPlaceholder('Duration').fill('20m');
  await page.getByTestId('rundown').getByPlaceholder('Duration').press('Enter');

  // add delay block
  await page.getByRole('button', { name: 'Delay' }).nth(0).click();

  // fill positive delay
  await page.getByTestId('delay-input').click();
  await page.getByTestId('delay-input').fill('2m');
  await page.getByTestId('delay-input').press('Enter');
  await page.getByText('New start 00:12').click();

  // make negative delay
  await page.getByTestId('subtract-time').click();
  await page.getByText('New start 00:08').click();

  // apply delay
  await page.getByRole('button', { name: 'Make permanent' }).click();
  await expect(page.getByTestId('rundown').getByTestId('time-input-timeStart')).toHaveValue('00:08:00');

  // add new delay
  await page.getByTestId('rundown').getByPlaceholder('Start').click();
  await page.getByRole('button', { name: 'Delay' }).nth(0).click();
  await page.getByTestId('delay-input').click();
  await page.getByTestId('delay-input').fill('10m');
  await page.getByTestId('delay-input').press('Enter');
  await page.getByText('New start 00:18').click();

  // cancel delay
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByTestId('rundown').getByTestId('time-input-timeStart')).toHaveValue('00:08:00');
  await expect(page.getByText('New start 00:18')).toHaveCount(0);
});

test('delays are show correctly', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  // add a test event
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('button', { name: 'Clear rundown' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();
  await page.getByRole('button', { name: 'Create Event' }).click();

  await page.getByTestId('time-input-timeStart').click();
  await page.getByTestId('rundown').getByTestId('time-input-timeStart').click();
  await page.getByTestId('rundown').getByTestId('time-input-timeStart').fill('10');
  await page.getByTestId('rundown').getByTestId('time-input-timeStart').press('Enter');
  await page.getByTestId('rundown').getByTestId('time-input-duration').click();
  await page.getByTestId('rundown').getByTestId('time-input-duration').fill('10');
  await page.getByTestId('rundown').getByTestId('time-input-duration').press('Enter');
  await page.getByTestId('block__title').click();
  await page.getByTestId('block__title').fill('test');
  await page.getByTestId('block__title').press('Enter');
  await expect(page.getByTestId('entry-1').locator('#block-status')).toHaveAttribute('data-ispublic', 'true');

  // add a delay
  await page.getByRole('button', { name: 'Delay' }).nth(0).click();
  await page.getByTestId('delay-input').click();
  await page.getByTestId('delay-input').fill('1');
  await page.getByTestId('delay-input').press('Enter');

  // delay is shown in the editor
  await page.getByText('New start 00:11').click();

  // delay is shown in the cuesheet
  await page.goto('http://localhost:4001/cuesheet');
  await page.getByRole('cell', { name: 'Delayed by 1 min' }).click();

  // delay is NOT shown in the public view
  await page.goto('http://localhost:4001/public');
  await page.getByText('00:10 → 00:20').click();

  // delay is shown in the backstage view
  await page.goto('http://localhost:4001/backstage');
  await page.getByText('00:11 → 00:21').click();
});
