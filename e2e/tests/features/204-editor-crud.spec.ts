import { test, expect } from '@playwright/test';

test('CRUD operations on the rundown', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  // clear rundown
  await page.getByRole('button', { name: 'Run mode' }).click();
  await page.getByRole('button', { name: 'Rundown menu' }).click();
  await page.getByRole('menuitem', { name: 'Delete all events' }).click();

  // create event from the rundown empty button
  await page.getByRole('button', { name: 'Create Event' }).click();

  // create blocks using the quick add buttons
  await page.getByRole('button', { name: 'Block' }).click();
  await page.getByRole('button', { name: 'Delay' }).click();
  await page.getByTestId('quick-add-event').click();

  // test quick add options - start is last end
  await page.getByTestId('entry-2').getByTestId('time-input-duration').fill('20m');
  await page.getByTestId('quick-add-event').click();
  await expect(page.getByLabel('Link to previous')).toBeChecked();
  expect(await page.getByTestId('entry-3').getByTestId('time-input-timeStart').inputValue()).toContain('00:20:00');

  // test quick add options - event is public
  await expect(page.getByLabel('Event is public')).toBeChecked();
  await page.getByTestId('quick-add-event').click();

  await expect(page.getByTestId('entry-4').locator('#block-status')).toHaveAttribute('data-ispublic', 'true');
});
