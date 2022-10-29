import { expect, test } from '@playwright/test';

test.describe('pages routes are available', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });
  test.describe('backstage views', () => {
    test('editor', async ({ page }) => {
      await page.goto('http://localhost:4001/editor');

      await expect(page).toHaveTitle(/ontime/);
      await page.getByTestId('event-editor').click();
      await page.getByTestId('panel-event-list').click();
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
      await page.goto('http://localhost:4001/eventlist');
      await page.getByTestId('panel-event-list').click();
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

  test.describe('client routes', () => {
    test('stage timer', async ({ page }) => {
      await page.goto('http://localhost:4001/timer');
      await page.getByTestId('timer-view').click();
    });
    test('clock', async ({ page }) => {
      await page.goto('http://localhost:4001/clock');
      await page.getByTestId('clock-view').click();
    });
    test('minimal timer', async ({ page }) => {
      await page.goto('http://localhost:4001/minimal');
      await page.getByTestId('minimal-timer').click();
    });
    test('backstage', async ({ page }) => {
      await page.goto('http://localhost:4001/backstage');
      await page.getByTestId('backstage-view').click();
    });
    test('public', async ({ page }) => {
      await page.goto('http://localhost:4001/public');
      await page.getByTestId('public-view').click();
    });
    test('pip', async ({ page }) => {
      await page.goto('http://localhost:4001/pip');
      await page.getByTestId('pip-view').click();
    });
    test('studio clock', async ({ page }) => {
      await page.goto('http://localhost:4001/studio');
      await page.getByTestId('studio-view').click();
    });
    test('lower', async ({ page }) => {
      await page.goto('http://localhost:4001/lower');
      const errorBoundary = await page.locator('data-test-id=error-container');
      await expect(errorBoundary).toHaveCount(0);
    });
  });
});
