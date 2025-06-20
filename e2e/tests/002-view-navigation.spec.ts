import { expect, type Page, test } from '@playwright/test';

test.describe('test view navigation feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4001/');
    page.locator('data-test-id=timer-view');
  });

  test('Minimal', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('link', { name: 'Minimal Timer' }).click();
    page.locator('data-test-id=minimal-timer');
    await expect(page).toHaveURL('http://localhost:4001/minimal');
  });

  test('Wall Clock', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('link', { name: 'Wall Clock', exact: true }).click();
    page.locator('data-test-id=clock-view');
    await expect(page).toHaveURL('http://localhost:4001/clock');
  });

  test('Timeline', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('link', { name: 'Timeline' }).click();
    page.locator('data-test-id=timeline-view');
    await expect(page).toHaveURL('http://localhost:4001/timeline');
  });

  test('Backstage', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('link', { name: 'Backstage' }).click();
    page.locator('data-test-id=backstage-view');
    await expect(page).toHaveURL('http://localhost:4001/backstage');
  });

  test('Lower Thirds', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('link', { name: 'Lower Thirds' }).click();
    await expect(page).toHaveURL('http://localhost:4001/lower');
    const errorBoundary = page.locator('data-test-id=error-container');
    await expect(errorBoundary).toHaveCount(0);
  });

  test('Studio Clock', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('link', { name: 'Studio Clock' }).click();
    page.locator('data-test-id=studio-view');
    await expect(page).toHaveURL('http://localhost:4001/studio');
  });

  test('Countdown', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('link', { name: 'Countdown' }).click();
    page.locator('data-test-id=countdown-view');
    await expect(page).toHaveURL('http://localhost:4001/countdown');
  });

  test('Project Info', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('link', { name: 'Project Info' }).click();
    page.locator('data-test-id=project-view');
    await expect(page).toHaveURL('http://localhost:4001/info');
  });

  test('Timer', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('link', { name: 'Timer', exact: true }).click();
    page.locator('data-test-id=timer-view');
    await expect(page).toHaveURL('http://localhost:4001/timer');
  });
});

async function openNavigationMenu(page: Page) {
  await page.keyboard.press('ControlOrMeta + ,');
}
