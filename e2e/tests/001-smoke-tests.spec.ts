import { expect, test } from '@playwright/test';

// TODO: can we replace the clicks with something else?
test.describe('pages routes are available', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });
  test.describe('main views', () => {
    test('editor', async ({ page }) => {
      await page.goto('http://localhost:4001/editor');

      await expect(page).toHaveTitle(/ontime/);
      await expect(page.getByTestId('editor-container')).toBeVisible();
      await expect(page.getByTestId('panel-rundown')).toBeVisible();
      await expect(page.getByTestId('panel-timer-control')).toBeVisible();
      await expect(page.getByTestId('panel-messages-control')).toBeVisible();
    });

    test('cuesheet', async ({ page }) => {
      await page.goto('http://localhost:4001/cuesheet');

      await expect(page).toHaveTitle(/ontime/);
      await page.getByTestId('cuesheet').click();
    });

    test('operator', async ({ page }) => {
      await page.goto('http://localhost:4001/op');

      await expect(page).toHaveTitle(/ontime/);
    });

    test('timer', async ({ page }) => {
      await page.goto('http://localhost:4001/timer');

      await expect(page).toHaveTitle(/ontime/);
    });

    test('backstage', async ({ page }) => {
      await page.goto('http://localhost:4001/backstage');

      await expect(page).toHaveTitle(/ontime/);
    });

    test('studio', async ({ page }) => {
      await page.goto('http://localhost:4001/studio');

      await expect(page).toHaveTitle(/ontime/);
    });

    test('countdown', async ({ page }) => {
      await page.goto('http://localhost:4001/countdown');

      await expect(page).toHaveTitle(/ontime/);

      await page.getByRole('button', { name: 'Add' }).click();
      await page.getByText('Albania').click();
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByText('Albania')).toBeVisible();
      await expect(page.getByText('Latvia')).toBeHidden();
    });
  });

  test.describe('detached views', () => {
    test('rundown', async ({ page }) => {
      await page.goto('http://localhost:4001/rundown');
      await expect(page.getByTestId('panel-rundown')).toBeVisible();
    });
    test('timer control', async ({ page }) => {
      await page.goto('http://localhost:4001/timercontrol');
      await expect(page.getByTestId('panel-timer-control')).toBeVisible();
    });
    test('message control', async ({ page }) => {
      await page.goto('http://localhost:4001/messagecontrol');
      await expect(page.getByTestId('panel-messages-control')).toBeVisible();
    });
  });
});
