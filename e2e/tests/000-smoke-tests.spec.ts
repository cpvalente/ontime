import { expect, test } from '@playwright/test';

test.describe('pages routes are available', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });
  test.describe('backstage views', () => {
    test('editor', async ({ page }) => {
      await page.goto('http://localhost:4001/editor');

      await expect(page).toHaveTitle(/ontime/);
      await expect(page.getByTestId('event-editor')).toBeVisible()
      await expect(page.getByTestId('panel-rundown')).toBeVisible()
      await expect(page.getByTestId('panel-timer-control')).toBeVisible()
      await expect(page.getByTestId('panel-messages-control')).toBeVisible()
      await expect(page.getByTestId('panel-info')).toBeVisible()
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
      await expect(page.getByTestId('panel-rundown')).toBeVisible()
    });
    test('timer control', async ({ page }) => {
      await page.goto('http://localhost:4001/timercontrol');
      await expect(page.getByTestId('panel-timer-control')).toBeVisible()
    });
    test('message control', async ({ page }) => {
      await page.goto('http://localhost:4001/messagecontrol');
      await expect(page.getByTestId('panel-messages-control')).toBeVisible()
    });
    test('info', async ({ page }) => {
      await page.goto('http://localhost:4001/info');
      await expect(page.getByTestId('panel-info')).toBeVisible()
    });
  });
});
