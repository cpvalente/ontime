import { expect, test } from '@playwright/test';

test.describe('test view navigation feature', () => {
  test('user flow through links', async ({ page }) => {
    // default view is timer view
    await page.goto('http://localhost:4001/');
    page.locator('data-test-id=timer-view');

    await openNavigationMenu();
    page.locator('data-test-id=navigation__menu');
    await page.getByRole('link', { name: 'Minimal Timer' }).click();
    page.locator('data-test-id=minimal-timer');
    await expect(page).toHaveURL('http://localhost:4001/minimal');

    await openNavigationMenu();
    page.locator('data-test-id=navigation__menu');
    await page.getByRole('link', { name: 'Wall Clock', exact: true }).click();
    page.locator('data-test-id=clock-view');
    await expect(page).toHaveURL('http://localhost:4001/clock');

    await openNavigationMenu();
    page.locator('data-test-id=navigation__menu');
    await page.getByRole('link', { name: 'timeline' }).click();
    page.locator('data-test-id=timeline-view');
    await expect(page).toHaveURL('http://localhost:4001/timeline');

    await openNavigationMenu();
    page.locator('data-test-id=navigation__menu');
    await page.getByRole('link', { name: 'Backstage' }).click();
    page.locator('data-test-id=backstage-view');
    await expect(page).toHaveURL('http://localhost:4001/backstage');

    await openNavigationMenu();
    page.locator('data-test-id=navigation__menu');
    await page.getByRole('link', { name: 'Lower Thirds' }).click();
    await expect(page).toHaveURL('http://localhost:4001/lower');
    const errorBoundary = page.locator('data-test-id=error-container');
    await expect(errorBoundary).toHaveCount(0);

    await openNavigationMenu();
    page.locator('data-test-id=navigation__menu');
    await page.getByRole('link', { name: 'Studio Clock' }).click();
    page.locator('data-test-id=studio-view');
    await expect(page).toHaveURL('http://localhost:4001/studio');

    await openNavigationMenu();
    page.locator('data-test-id=navigation__menu');
    await page.getByRole('link', { name: 'Countdown' }).click();
    page.locator('data-test-id=countdown-view');
    await expect(page).toHaveURL('http://localhost:4001/countdown');

    await openNavigationMenu();
    page.locator('data-test-id=navigation__menu');
    await page.getByRole('link', { name: 'Project Info' }).click();
    page.locator('data-test-id=project-view');
    await expect(page).toHaveURL('http://localhost:4001/info');

    await openNavigationMenu();
    page.locator('data-test-id=navigation__menu');
    await page.getByRole('link', { name: 'Timer', exact: true }).click();
    page.locator('data-test-id=timer-view');
    await expect(page).toHaveURL('http://localhost:4001/timer');

    /**
     * We need to hover to activate the menu button
     */
    async function openNavigationMenu() {
      await page.mouse.move(Math.random() * 100, Math.random() * 100);
      await page.getByRole('button', { name: 'toggle menu' }).click({ force: true });
    }
  });
});
