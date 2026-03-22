import { readFile } from 'fs/promises';

import { expect, test } from '@playwright/test';

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
