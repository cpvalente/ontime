import { expect, test } from '@playwright/test';

test.describe('pages routes are available', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });
  test.describe('backstage views', () => {
    test('editor', async ({ page }) => {
      await page.goto('http://localhost:4001/editor');

      await expect(page).toHaveTitle(/ontime/);
      await page.getByTestId('event-editor').click();
      await page.getByTestId('panel-rundown').click();
      await page.getByTestId('panel-timer-control').click();
      await page.getByTestId('panel-messages-control').click();
      await page.getByTestId('panel-info').click();
    });
    test('cuesheet', async ({ page }) => {
      await page.goto('http://localhost:4001/cuesheet');

      await expect(page).toHaveTitle(/ontime/);
      await page.getByTestId('cuesheet').click();
    });
  });

  test.describe('detached views', () => {
    test('rundown', async ({ page }) => {
      await page.goto('http://localhost:4001/rundown');
      await page.getByTestId('panel-rundown').click();
    });
    test('timer control', async ({ page }) => {
      await page.goto('http://localhost:4001/timercontrol');
      await page.getByTestId('panel-timer-control').click();
    });
    test('message control', async ({ page }) => {
      await page.goto('http://localhost:4001/messagecontrol');
      await page.getByTestId('panel-messages-control').click();
    });
    test('info', async ({ page }) => {
      await page.goto('http://localhost:4001/info');
      await page.getByTestId('panel-info').click();
    });
  });
});
