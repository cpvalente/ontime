import { expect, test } from '@playwright/test';

test('Aux timer buttons', async ({ page }) => {
  await page.goto('http://localhost:4001/editor');
  await page.getByTestId('time-input-aux1').click();
  await page.getByTestId('time-input-aux1').fill('123456');
  await page.getByTestId('time-input-aux1').press('Enter');
  await expect(page.getByTestId('time-input-aux1')).toHaveValue('12:34:56');
  await page.getByTestId('aux-timer-start-1').click();
  await expect(page.getByTestId('time-label-aux1')).toHaveText('12:34:53', { timeout: 4000 });
  await page.getByTestId('aux-timer-pause-1').click();
  await expect(page.getByTestId('time-label-aux1')).toHaveText('12:34:53');
  await page.getByTestId('aux-timer-stop-1').click();
  await expect(page.getByTestId('time-input-aux1')).toHaveValue('12:34:56');
  await page.getByTestId('aux-timer-direction-1').click();
  await page.getByTestId('aux-timer-start-1').click();
  await expect(page.getByTestId('time-label-aux1')).toHaveText('12:34:59', { timeout: 4000 });
  await page.getByTestId('aux-timer-stop-1').click();
});
