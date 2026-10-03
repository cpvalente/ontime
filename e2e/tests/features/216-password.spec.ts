import { expect, test } from '../fixtures/override';

// this server is started with a password in playwright.config.ts
const protectedURL = 'http://localhost:4002';
const password = 'e2e-password';

test('a password protected server requires login and returns to the requested view', async ({ page }) => {
  // data cannot be read without logging in
  const unauthorised = await page.request.get(`${protectedURL}/data/settings`);
  expect(unauthorised.status()).toBe(401);

  // views redirect to the login page, remembering where we were going
  await page.goto(`${protectedURL}/timer`);
  await expect(page).toHaveURL(`${protectedURL}/login?redirect=/timer`);

  // a wrong password is rejected
  await page.getByPlaceholder('Password').fill('not-the-password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText('Unauthorized')).toBeVisible();

  // the right password lands on the requested view
  await page.goto(`${protectedURL}/timer`);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(new RegExp(`^${protectedURL}/timer/?$`));
  await expect(page.getByTestId('timer-view')).toBeVisible();

  // the session is kept for data requests
  const authorised = await page.request.get(`${protectedURL}/data/settings`);
  expect(authorised.status()).toBe(200);
});
