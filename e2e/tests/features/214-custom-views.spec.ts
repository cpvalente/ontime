import { readFile } from 'fs/promises';

import { expect, test } from '../fixtures/override';

const baseURL = 'http://localhost:4001';
const apiURL = `${baseURL}/data/custom-views`;
const testSlug = 'e2e-test-view';
const fixtureFile = 'e2e/tests/fixtures/custom-view-test.html';

test.describe('custom views', () => {
  test.afterEach(async ({ request }) => {
    try {
      await request.delete(`${apiURL}/${testSlug}`);
    } catch {
      /** nothing to do here */
    }
  });

  test('upload, list, serve, and delete a custom view', async ({ page, request }) => {
    // 1. Upload a custom view via the API
    const fileContent = await readFile(fixtureFile);
    const response = await request.post(`${apiURL}/${testSlug}/upload`, {
      multipart: {
        indexHtml: {
          name: 'index.html',
          mimeType: 'text/html',
          buffer: fileContent,
        },
      },
    });
    expect(response.status()).toBe(201);

    // 2. Verify the view appears in the listing
    const listResponse = await request.get(apiURL);
    expect(listResponse.ok()).toBeTruthy();
    const listData = await listResponse.json();
    const uploadedView = listData.views.find((v: { slug: string }) => v.slug === testSlug);
    expect(uploadedView).toBeDefined();

    // 3. Navigate to the custom view URL and verify it renders
    await page.goto(`${baseURL}/external/${testSlug}/`);
    await expect(page.getByTestId('custom-view-heading')).toBeVisible();
    await expect(page.getByTestId('custom-view-heading')).toHaveText('Custom View E2E Test');

    // 4. Delete the view
    const deleteResponse = await request.delete(`${apiURL}/${testSlug}`);
    expect(deleteResponse.status()).toBe(204);

    // 5. Verify the view is removed from the listing
    const listAfterDelete = await request.get(apiURL);
    const dataAfterDelete = await listAfterDelete.json();
    const deletedView = dataAfterDelete.views.find((v: { slug: string }) => v.slug === testSlug);
    expect(deletedView).toBeUndefined();
  });
});

test('the bundled demo view opens from the menu, shows live data and can be shared', async ({ page, request }) => {
  const restore = await request.post(`${apiURL}/restore-demo`);
  expect(restore.status()).toBe(201);
  const preset = { alias: 'e2e-share', target: 'timer', search: '', enabled: true, displayInNav: false };
  await request.post(`${baseURL}/data/url-presets`, { data: preset });
  await request.patch(`${apiURL}/demo`, { data: { displayInNav: true } });

  try {
    // the navigation menu leaves the app for the custom view, and Back returns to it
    await page.goto(`${baseURL}/timer`);
    await expect(page.getByTestId('timer-view')).toBeVisible();
    await page.keyboard.press('Space');
    await page.getByRole('button', { name: 'demo', exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/external/demo/`);
    await expect(page.getByRole('heading', { name: 'Ontime demo' })).toBeVisible();
    // the clock is filled in from the websocket
    await expect(page.locator('#clock')).not.toHaveText('-');
    await page.goBack();
    await expect(page.getByTestId('timer-view')).toBeVisible();

    // a fresh load of the share menu lists both URL presets and custom views
    await page.goto(`${baseURL}/editor`);
    await page.getByRole('button', { name: 'Toggle settings' }).click();
    await page.getByRole('button', { name: 'Share link' }).click();
    await page.getByRole('combobox').filter({ hasText: 'Timer' }).click();
    await expect(page.getByRole('option', { name: 'URL Preset: e2e-share' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Custom view: demo' })).toBeVisible();
  } finally {
    await request.patch(`${apiURL}/demo`, { data: { displayInNav: false } });
    await request.delete(`${baseURL}/data/url-presets/${preset.alias}`);
  }
});
