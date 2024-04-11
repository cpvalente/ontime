import { test, expect } from '@playwright/test';

test('Aux timer buttons', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');
  await page.getByTestId('time-input-auxTimer').click();
  await page.getByTestId('time-input-auxTimer').fill('123456');
  await page.getByTestId('time-input-auxTimer').press('Enter');
  await expect(page.getByTestId('time-input-auxTimer')).toHaveValue('12:34:56');
  await page.getByTestId('aux-timer-start').click();
  await expect(page.getByTestId('time-input-auxTimer')).toHaveValue('12:34:53', { timeout: 4000 });
  await page.getByTestId('aux-timer-pause').click();
  await expect(page.getByTestId('time-input-auxTimer')).toHaveValue('12:34:53');
  await page.getByTestId('aux-timer-stop').click();
  await expect(page.getByTestId('time-input-auxTimer')).toHaveValue('12:34:56');
  await page.getByTestId('aux-timer-direction').click();
  await page.getByTestId('aux-timer-start').click();
  await expect(page.getByTestId('time-input-auxTimer')).toHaveValue('12:34:59', { timeout: 4000 });
});
