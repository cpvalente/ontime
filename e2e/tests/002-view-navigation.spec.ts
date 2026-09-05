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

  /**
   * The shortcut has to read the current open state, not the one captured when it was
   * registered, otherwise it only ever opens the menu.
   */
  test('Space closes the menu as well as opening it', async ({ page }) => {
    const menu = page.getByRole('dialog');
    await expect(menu).toBeHidden();

    await openNavigationMenu(page);
    await expect(menu).toBeVisible();

    await page.keyboard.press('Space');
    await expect(menu).toBeHidden();
  });

  test('Space closes a menu opened with the button', async ({ page }) => {
    await page.mouse.move(Math.random() * 100, Math.random() * 100);
    await page.getByTestId('navigation__toggle-menu').click();

    const menu = page.getByRole('dialog');
    await expect(menu).toBeVisible();

    await page.keyboard.press('Space');
    await expect(menu).toBeHidden();
  });

  test('Space toggles a focused menu switch without closing the menu', async ({ page }) => {
    await openNavigationMenu(page);

    const menu = page.getByRole('dialog');
    const flipScreen = page.getByRole('switch', { name: 'Flip Screen' });
    await expect(menu).toBeVisible();

    const initiallyChecked = await flipScreen.getAttribute('aria-checked');
    await flipScreen.focus();
    await page.keyboard.press('Space');

    await expect(flipScreen).toHaveAttribute('aria-checked', initiallyChecked === 'true' ? 'false' : 'true');
    await expect(menu).toBeVisible();
  });

  test('not-found', async ({ page }) => {
    await page.goto('/not-found');

    await expect(page).toHaveTitle(/ontime/i);
    await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible();

    await page.goto('/preset/not-found');

    await expect(page).toHaveTitle(/ontime/i);
    await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible();
  });
});

async function openNavigationMenu(page: Page) {
  await page.keyboard.press('Space');
}
