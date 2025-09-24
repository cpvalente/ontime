import { test, expect } from '@playwright/test';

test('manifest start_url is correct for cuesheet', async ({ page }) => {
  await page.goto('/cuesheet');
  const manifestUrl = await page.evaluate(() => {
    const link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      return null;
    }
    return (link as HTMLLinkElement).href;
  });

  expect(manifestUrl).not.toBeNull();

  const response = await page.request.get(manifestUrl!);
  const manifest = await response.json();

  expect(manifest.start_url).toContain('/cuesheet');
});

test('manifest start_url is correct for op', async ({ page }) => {
  await page.goto('/op');
  const manifestUrl = await page.evaluate(() => {
    const link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      return null;
    }
    return (link as HTMLLinkElement).href;
  });

  expect(manifestUrl).not.toBeNull();

  const response = await page.request.get(manifestUrl!);
  const manifest = await response.json();

  expect(manifest.start_url).toContain('/op');
});
