import { expect, test } from '@playwright/test';

test.describe('minimal view behaviour can be changed through params', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });
  test('without overloads', async ({ page }) => {
    await page.goto('http://localhost:4001/minimal');
    await page.getByTestId('minimal-timer').click();
  });
  test('hide nav', async ({ page }) => {
    await page.goto('http://localhost:4001/minimal?hidenav=true');
    const navBar = await page.locator('data-test-id=nav-logo');
    await expect(navBar).toHaveCount(0);
  });
});
