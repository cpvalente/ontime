import { test, expect } from '@playwright/test';

test('Rearrange while playing', async ({ page }) => {
  await page.goto('http://localhost:4001/rundown');

  // clear rundown
  await page.getByRole('button', { name: 'Clear rundown' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  // create events
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('button', { name: 'Event' }).nth(4).click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  // start event 2
  await page.getByTestId('entry-2').getByRole('button', { name: 'Start event' }).click();
  await expect(page.getByTestId('entry-2').locator('#event-block')).toHaveCSS('background-color', 'rgb(8, 122, 39)');

  // move event 2 up
  await page.getByTestId('entry-2').locator('#event-block').getByText('2').click();
  await page.getByTestId('entry-2').locator('#event-block div').filter({ hasText: '2' }).press('Alt+Control+ArrowUp');

  // event CUE1 should new be entry 2
  await expect(page.getByTestId('entry-2').locator('#event-block')).toContainText('1');
  // but entry 1 should be the one playing (it will be unlinked as it will be the first event)
  await expect(page.getByTestId('entry-1').locator('#event-block')).toHaveCSS('background-color', 'rgb(8, 122, 39)');
});
