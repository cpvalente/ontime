import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('about:blank');
  await page.goto('chrome-error://chromewebdata/');
  await page.goto('http://localhost:4001/editor');
  await page.goto('http://localhost:4001/op');
  await page.getByText('Eurovision Song Contest').click();
  await page.getByText('16:50:00').click();
  await page.getByText('17:10:00').click();
  await page.getByText('Elapsed time...').click();
  await page.getByText('...').first().click();
  await page.getByText('...').nth(1).click();
  await page.getByText('Albania - Sekret').click();
  await page.getByText('Lithuania - SentimentaiSF1.0310:50 - 11:1000:20:00').click();
  await page.goto('http://localhost:4001/editor');
  await page.getByTestId('panel-timer-control').getByRole('button', { name: 'Start' }).click();
});
