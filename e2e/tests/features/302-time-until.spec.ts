import { expect, test } from '@playwright/test';

//TODO: this test it not complete, also we can't test unliked timers without mocking the internal clock

test('time until calculation', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');
  await page.getByRole('button', { name: 'Clear rundown' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('button', { name: 'Event' }).nth(4).click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await page.getByTestId('entry-1').getByLabel('Start event').click();
  await page.getByLabel('Pause event').click();
  await page.getByTestId('time-input-addtime').click();
  await page.getByTestId('time-input-addtime').fill('10');
  await page.getByTestId('time-input-addtime').press('Enter');
  await page.getByLabel('removetime').click();
  await expect(page.getByTestId('entry-2').locator('#event-block')).toContainText('DUE');
  await expect(page.getByTestId('entry-3').locator('#event-block')).toContainText('10m');
  await expect(page.getByTestId('entry-4').locator('#event-block')).toContainText('20m');
});
