import { test, expect } from '@playwright/test';

test('smoke test operator', async ({ page }) => {
  // make some boilerplate
  await page.goto('http://localhost:4001/editor');
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('button', { name: 'Clear rundown' }).click();
  await page.getByRole('button', { name: 'Create Event' }).click();

  await page.getByTestId('time-input-timeStart').fill('1m');
  await page.getByTestId('time-input-timeStart').press('Enter');
  await page.getByTestId('time-input-duration').fill('1m');
  await page.getByTestId('time-input-duration').press('Enter');

  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await page.getByTestId('entry-2').getByTestId('lock__duration').click();
  await page.getByTestId('entry-2').getByTestId('time-input-duration').fill('1m');
  await page.getByTestId('entry-2').getByTestId('time-input-duration').press('Enter');
  await page.getByTestId('entry-2').getByTestId('time-input-duration').press('Enter');

  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await page.getByTestId('entry-3').getByTestId('lock__duration').click();
  await page.getByTestId('entry-3').getByTestId('time-input-duration').fill('1m');
  await page.getByTestId('entry-3').getByTestId('time-input-duration').press('Enter');

  await page.getByRole('button', { name: 'Block' }).nth(1).click();

  await page.getByRole('button', { name: 'Edit' }).nth(1).click();
  await page.getByTestId('entry-1').click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  await page.getByTestId('entry-1').getByTestId('block__title').click();
  await page.getByTestId('entry-1').getByTestId('block__title').fill('title 1');
  await page.getByTestId('entry-1').getByTestId('block__title').press('Enter');

  await page.getByTestId('entry-2').click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  await page.getByTestId('entry-2').getByTestId('block__title').click();
  await page.getByTestId('entry-2').getByTestId('block__title').fill('title 2');
  await page.getByTestId('entry-2').getByTestId('block__title').press('Enter');

  await page.getByTestId('entry-3').click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  await page.getByTestId('entry-3').getByTestId('block__title').click();
  await page.getByTestId('entry-3').getByTestId('block__title').fill('title 3');
  await page.getByTestId('entry-3').getByTestId('block__title').press('Enter');

  // start an event
  await page.getByTestId('panel-timer-control').getByRole('button', { name: 'Start' }).click();

  await page.goto('http://localhost:4001/op');

  await expect(page.getByText('title 1')).toBeInViewport();
  await expect(page.getByText('title 2')).toBeInViewport();
  await expect(page.getByText('title 3')).toBeInViewport();

  // TODO: this part seems particularly flaky, to revise
  // await expect(page.getByText('00:01 - 00:02')).toBeInViewport();
  // await expect(page.getByText('00:02 - 00:03')).toBeInViewport();
  // await expect(page.getByText('00:03 - 00:04')).toBeInViewport();
});
