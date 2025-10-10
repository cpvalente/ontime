import { expect, test } from '@playwright/test';

test.describe('pages routes are available', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });
  test.describe('main views', () => {
    test('editor', async ({ page }) => {
      await page.goto('/editor');

      await expect(page).toHaveTitle(/ontime/);
      await expect(page.getByTestId('editor-container')).toBeVisible();
      await expect(page.getByTestId('panel-rundown')).toBeVisible();
      await expect(page.getByTestId('panel-timer-control')).toBeVisible();
      await expect(page.getByTestId('panel-messages-control')).toBeVisible();
    });

    test('cuesheet', async ({ page }) => {
      await page.goto('/cuesheet');

      await expect(page).toHaveTitle(/ontime/);
      await expect(page.getByTestId('cuesheet')).toBeVisible();
    });

    test('operator', async ({ page }) => {
      await page.goto('/op');

      await expect(page).toHaveTitle(/ontime/);
    });

    test('timer', async ({ page }) => {
      await page.goto('/timer');

      await expect(page).toHaveTitle(/ontime/);
    });

    test('backstage', async ({ page }) => {
      await page.goto('/backstage');

      await expect(page).toHaveTitle(/ontime/);
    });

    test('studio', async ({ page }) => {
      await page.goto('/studio');

      await expect(page).toHaveTitle(/ontime/);
    });

    test('countdown', async ({ page }) => {
      await page.goto('/countdown?sub=32d31');

      await expect(page).toHaveTitle(/ontime/);

      await expect(page.getByText('Albania')).toBeVisible();
      await expect(page.getByText('Latvia')).toBeHidden();
    });
  });

  test.describe('detached views', () => {
    test('rundown', async ({ page }) => {
      await page.goto('/rundown');
      await expect(page.getByTestId('panel-rundown')).toBeVisible();
    });
    test('timer control', async ({ page }) => {
      await page.goto('/timercontrol');
      await expect(page.getByTestId('panel-timer-control')).toBeVisible();
    });
    test('message control', async ({ page }) => {
      await page.goto('/messagecontrol');
      await expect(page.getByTestId('panel-messages-control')).toBeVisible();
    });
  });
});
