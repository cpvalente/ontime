import { test, expect } from '@playwright/test';

test('Rearrange while playing', async ({ page }) => {
  await page.goto('http://localhost:4001/rundown');

  // clear rundown
  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  // create events
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('button', { name: 'Event' }).nth(4).click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  // start event 2
  await page.getByTestId('entry-2').getByRole('button', { name: 'Start event' }).click();
  await expect(page.getByTestId('entry-2').getByTestId('rundown-event')).toHaveAttribute('data-running');

  // move event 2 up
  await page.getByTestId('entry-2').getByTestId('rundown-event').locator('div').filter({ hasText: '2' }).click();
  await page
    .getByTestId('entry-2')
    .getByTestId('rundown-event')
    .locator('div')
    .filter({ hasText: '2' })
    .press('Alt+Control+ArrowUp');

  // event CUE1 should new be entry 2
  await expect(page.getByTestId('entry-2').getByTestId('rundown-event')).toContainText('1');
  // but entry 1 should be the one playing (it will be unlinked as it will be the first event)
  await expect(page.getByTestId('entry-1').getByTestId('rundown-event')).toHaveAttribute('data-running');
});

test('flag and unflag an event while playing', async ({ page }) => {
  await page.goto('http://localhost:4001/editor/');

  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('button', { name: 'Event' }).nth(4).click();

  //start the the first event
  await page.getByTestId('entry-1').getByRole('button', { name: 'Start event' }).click();

  // there should be no flag times
  await expect(page.getByTestId('flag-plannedStart')).toContainText('––:––:––');
  await expect(page.getByTestId('flag-expectedStart')).toContainText('––:––:––');

  // set the flag
  await page.getByTestId('entry-2').getByTestId('rundown-event').getByText('2').click({
    button: 'right',
  });
  await page.getByRole('menuitem', { name: 'Add flag' }).click();

  // now there should be flag times
  await expect(page.getByTestId('flag-plannedStart')).not.toContainText('––:––:––');
  await expect(page.getByTestId('flag-expectedStart')).not.toContainText('––:––:––');

  // remove the flag again
  await page.getByTestId('entry-2').getByTestId('rundown-event').getByText('2').click({
    button: 'right',
  });
  await page.getByRole('menuitem', { name: 'Remove flag' }).click();

  // there should be no flag times
  await expect(page.getByTestId('flag-plannedStart')).toContainText('––:––:––');
  await expect(page.getByTestId('flag-expectedStart')).toContainText('––:––:––');
});
