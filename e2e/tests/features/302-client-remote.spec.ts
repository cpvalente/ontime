import { expect, test } from '@playwright/test';

test('redirect', async ({ page }) => {
  await page.goto('http://localhost:4001/editor?settings=network__clients');
  await page.getByRole('button', { name: 'Redirect' }).click();
  await page.getByPlaceholder('newpath?and=params').click();
  await page.getByPlaceholder('newpath?and=params').fill('clock');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByTestId('clock-view')).toBeVisible();
});

test('identify', async ({ page }) => {
  await page.goto('http://localhost:4001/editor?settings=network__clients');
  await page.getByRole('button', { name: 'Identify' }).click();
  await expect(page.getByTestId('identify-overlay')).toBeVisible();
});

test('rename', async ({ page }) => {
  await page.goto('http://localhost:4001/editor?settings=network__clients');
  await page.getByRole('button', { name: 'Rename' }).click();
  await page.getByPlaceholder('new name').click();
  await page.getByPlaceholder('new name').fill('test');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('tbody')).toContainText('test');
});
