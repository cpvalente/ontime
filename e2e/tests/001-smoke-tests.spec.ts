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
      await page.screenshot({ path: 'automated-screenshots/editor.png' });
    });

    test('cuesheet', async ({ page }) => {
      await page.goto('http://localhost:4001/cuesheet');

      await expect(page).toHaveTitle(/ontime/);
      await page.getByTestId('cuesheet').click();
      await page.screenshot({ path: 'automated-screenshots/cuesheet.png' });
    });

    test('operator', async ({ page }) => {
      await page.goto('http://localhost:4001/op');

      await expect(page).toHaveTitle(/ontime/);
      await page.screenshot({ path: 'automated-screenshots/operator.png' });
    });

    test('timer', async ({ page }) => {
      await page.goto('http://localhost:4001/timer');

      await expect(page).toHaveTitle(/ontime/);
      await page.screenshot({ path: 'automated-screenshots/timer.png' });
    });

    test('clock', async ({ page }) => {
      await page.goto('http://localhost:4001/timer');

      await expect(page).toHaveTitle(/ontime/);
      await page.screenshot({ path: 'automated-screenshots/clock.png' });
    });

    test('minimal', async ({ page }) => {
      await page.goto('http://localhost:4001/minimal');

      await expect(page).toHaveTitle(/ontime/);
      await page.screenshot({ path: 'automated-screenshots/minimal.png' });
    });

    test('backstage', async ({ page }) => {
      await page.goto('http://localhost:4001/backstage');

      await expect(page).toHaveTitle(/ontime/);
      await page.screenshot({ path: 'automated-screenshots/backstage.png' });
    });

    test('public', async ({ page }) => {
      await page.goto('http://localhost:4001/public');

      await expect(page).toHaveTitle(/ontime/);
      await page.screenshot({ path: 'automated-screenshots/public.png' });
    });

    test('studio', async ({ page }) => {
      await page.goto('http://localhost:4001/studio');

      await expect(page).toHaveTitle(/ontime/);
      await page.screenshot({ path: 'automated-screenshots/studio.png' });
    });

    test('countdown', async ({ page }) => {
      await page.goto('http://localhost:4001/countdown');

      await expect(page).toHaveTitle(/ontime/);
      await page.screenshot({ path: 'automated-screenshots/countdown.png' });

      await page.getByRole('link', { name: '1. 10:00 → 10:20 | Albania' }).click();
      await page.getByText('Albania').click();
      await page.screenshot({ path: 'automated-screenshots/countdown-2.png' });
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
