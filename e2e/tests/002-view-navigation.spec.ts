import { type Page, expect, test } from '@playwright/test';

test.describe('test view navigation feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('data-testid=timer-view')).toBeVisible();
  });

  test('Timeline', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('button', { name: 'Timeline' }).click();
    await expect(page.getByTestId('timeline-view')).toBeVisible();
    await expect(page).toHaveURL('/timeline');
  });

  test('Backstage', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('button', { name: 'Backstage' }).click();
    await expect(page.getByTestId('backstage-view')).toBeVisible();
    await expect(page).toHaveURL('/backstage');
  });

  test('Studio Clock', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('button', { name: 'Studio Clock' }).click();
    await expect(page.getByTestId('studio-view')).toBeVisible();
    await expect(page).toHaveURL('/studio');
  });

  test('Countdown', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('button', { name: 'Countdown' }).click();
    await expect(page.getByTestId('countdown-view')).toBeVisible();
    await expect(page).toHaveURL('/countdown');
  });

  test('Project Info', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('button', { name: 'Project Info' }).click();
    await expect(page.getByTestId('project-view')).toBeVisible();
    await expect(page).toHaveURL('/info');
  });

  test('Timer', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('button', { name: 'Timer', exact: true }).click();
    await expect(page.getByTestId('timer-view')).toBeVisible();
    await expect(page).toHaveURL('/timer');
  });

  test('Teleprompter', async ({ page }) => {
    await openNavigationMenu(page);
    await page.getByRole('button', { name: 'Teleprompter' }).click();
    await expect(page.getByTestId('teleprompter-view')).toBeVisible();
    await expect(page).toHaveURL('/teleprompter');
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
