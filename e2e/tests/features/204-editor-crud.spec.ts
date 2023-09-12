import { test, expect } from '@playwright/test';

test('CRUD operations on the rundown', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  // clear rundown
  await page.getByRole('button', { name: 'Run mode' }).click();
  await page.getByRole('button', { name: 'Event...' }).click();
  await page.getByRole('menuitem', { name: 'Delete all events' }).click();

  // create event from the rundown empty button
  await page.getByRole('button', { name: 'Create Event' }).click();

  // create blocks using the quick add buttons
  await page.getByRole('button', { name: 'Block' }).click();
  await page.getByRole('button', { name: 'Delay' }).click();
  await page.getByTestId('quick-add-event').click();

  // test quick add options - start is last end
  await page.getByTestId('entry-2').getByTestId('time-input-timeEnd').fill('20m');
  await page.getByText('Start time is last end').click();
  await page.getByTestId('quick-add-event').click();
  await expect(await page.getByTestId('entry-3').getByTestId('time-input-timeStart').inputValue()).toContain(
    '00:20:00',
  );

  // test quick add options - event is public
  await page.locator('label').filter({ hasText: 'Event is public' }).click();
  await page.getByTestId('quick-add-event').click();

  await expect(await page.getByTestId('entry-4').getByRole('img').nth(3)).toHaveAttribute('data-ispublic', 'true');
});
