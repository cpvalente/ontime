import { expect, test } from '@playwright/test';

test('View params configures timer view', async ({ page }) => {
  await page.goto('/timer');

  await expect(page.getByText('TIME NOW')).toBeInViewport();

  await page.mouse.move(Math.random() * 100, Math.random() * 100);
  await page.getByTestId('navigation__toggle-settings').click();
  await page.locator('label').filter({ hasText: 'Hide Time NowHides the Time' }).locator('span').nth(2).click();
  await page.getByTestId('apply-view-params').click();

  await expect(page.getByText('TIME NOW', { exact: true })).not.toBeInViewport();
  await expect(page).toHaveURL(/.*hideClock=true/);
});

/**
 * The form gathers its values from the DOM, so a collapsed section has to stay mounted.
 * Unmounting it would quietly drop everything the user set in it on the next apply.
 */
test('View params keeps the values of collapsed sections', async ({ page }) => {
  // hideClock lives in the section we are about to collapse
  await page.goto('/timer?hideClock=true');
  await expect(page.getByText('TIME NOW', { exact: true })).not.toBeInViewport();

  await page.mouse.move(Math.random() * 100, Math.random() * 100);
  await page.getByTestId('navigation__toggle-settings').click();

  const section = page.getByRole('button', { name: /Element visibility/ });
  await expect(section).toHaveAttribute('aria-expanded', 'true');
  await section.focus();
  await page.keyboard.press('Space');
  await expect(section).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('dialog', { name: 'Ontime' })).toBeHidden();

  await page.getByTestId('apply-view-params').click();

  await expect(page).toHaveURL(/.*hideClock=true/);
  await expect(page.getByText('TIME NOW', { exact: true })).not.toBeInViewport();
});
