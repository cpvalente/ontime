import { expect, test } from '../fixtures/override';

test('Aux timer buttons', async ({ page }) => {
  await page.goto('/editor');
  await page.getByTestId('time-input-aux1').click();
  await page.getByTestId('time-input-aux1').fill('123456');
  await page.getByTestId('time-input-aux1').press('Enter');
  await expect(page.getByTestId('time-input-aux1')).toHaveValue('12:34:56');

  // the timer runs on the server, so we assert on direction rather than exact values
  // reading hh:mm:ss as a number (ie: 12:34:56 -> 123456) keeps its order
  const auxLabel = page.getByTestId('time-label-aux1');
  const readAux = async () => Number((await auxLabel.textContent())?.replaceAll(':', ''));

  // counts down
  await page.getByTestId('aux-timer-start-1').click();
  await expect.poll(readAux, { timeout: 4000 }).toBeLessThan(123456);

  // pausing keeps the elapsed time
  await page.getByTestId('aux-timer-pause-1').click();
  await expect(page.getByTestId('aux-timer-start-1')).toBeVisible();
  await expect.poll(readAux).toBeLessThan(123456);

  // stopping resets to the original duration
  await page.getByTestId('aux-timer-stop-1').click();
  await expect(page.getByTestId('time-input-aux1')).toHaveValue('12:34:56');

  // counts up
  await page.getByTestId('aux-timer-direction-1').click();
  await page.getByTestId('aux-timer-start-1').click();
  await expect.poll(readAux, { timeout: 4000 }).toBeGreaterThan(123456);
  await page.getByTestId('aux-timer-stop-1').click();

  // leave the timer counting down, as the server keeps this state between tests
  await page.getByTestId('aux-timer-direction-1').click();
  await expect(page.getByTestId('time-input-aux1')).toHaveValue('12:34:56');
});
