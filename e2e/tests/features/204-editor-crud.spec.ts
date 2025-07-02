import { test, expect } from '@playwright/test';

test('CRUD operations on the rundown', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();
  await expect(page.getByTestId('rundown-event')).toHaveCount(0);
  await expect(page.getByTestId('rundown-delay')).toHaveCount(0);
  await expect(page.getByTestId('rundown-block')).toHaveCount(0);

  // create event from the rundown empty button
  await page.getByRole('button', { name: 'Create Event' }).click();
  await expect(page.getByTestId('rundown-event')).toHaveCount(1);
  await expect(page.getByTestId('rundown-delay')).toHaveCount(0);
  await expect(page.getByTestId('rundown-block')).toHaveCount(0);

  // create blocks using the quick add buttons
  await page.getByRole('button', { name: 'Block' }).nth(1).click();
  await page.getByRole('button', { name: 'Delay' }).nth(1).click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await expect(page.getByTestId('rundown-event')).toHaveCount(2);
  await expect(page.getByTestId('rundown-delay')).toHaveCount(1);
  await expect(page.getByTestId('rundown-block')).toHaveCount(1);

  // test quick add options - star2+5-t is last end
  await page.getByTestId('entry-2').getByTestId('time-input-duration').fill('20m');
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  expect(await page.getByTestId('entry-3').getByTestId('time-input-timeStart').inputValue()).toContain('00:30:00');
  await expect(page.getByTestId('rundown-event')).toHaveCount(3);
  await expect(page.getByTestId('rundown-delay')).toHaveCount(1);
  await expect(page.getByTestId('rundown-block')).toHaveCount(1);

  // test quick add options
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await expect(page.getByTestId('rundown-event')).toHaveCount(4);
  await expect(page.getByTestId('rundown-delay')).toHaveCount(1);
  await expect(page.getByTestId('rundown-block')).toHaveCount(1);

  await expect(page.getByTestId('entry-4').locator('#block-status')).toHaveAttribute('data-timerType', 'count-down');
});
