import { type Page, expect, test } from '@playwright/test';

test.describe('test view navigation feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('data-testid=timer-view')).toBeVisible();
  });

  test('Timeline', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('button', { name: 'Timeline' }).click();
    page.locator('data-testid=timeline-view');
    await expect(page).toHaveURL('/timeline');
  });

  test('Backstage', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('button', { name: 'Backstage' }).click();
    page.locator('data-testid=backstage-view');
    await expect(page).toHaveURL('/backstage');
  });

  test('Studio Clock', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('button', { name: 'Studio Clock' }).click();
    page.locator('data-testid=studio-view');
    await expect(page).toHaveURL('/studio');
  });

  test('Countdown', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('button', { name: 'Countdown' }).click();
    page.locator('data-testid=countdown-view');
    await expect(page).toHaveURL('/countdown');
  });

  test('Project Info', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('button', { name: 'Project Info' }).click();
    page.locator('data-testid=project-view');
    await expect(page).toHaveURL('/info');
  });

  test('Timer', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('button', { name: 'Timer', exact: true }).click();
    page.locator('data-testid=timer-view');
    await expect(page).toHaveURL('/timer');
  });

  test('not-found', async ({ page }) => {
    await page.goto('/not-found');

    await expect(page).toHaveTitle(/ontime/);
    await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible();

    await page.goto('/preset/not-found');

    await expect(page).toHaveTitle(/ontime/);
    await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible();
  });
});

async function openNavigationMenu(page: Page) {
  await page.keyboard.press('Space');
}
