import { expect, test } from '@playwright/test';

const settingsURL = '/data/settings';

/**
 * Pins the production timezone so the shift does not depend on the machine running the tests
 * Asia/Kolkata has no DST, making the delta from UTC a constant +5h30m
 */
async function setProductionTimezone(request: import('@playwright/test').APIRequestContext, zone: string | null) {
  const settings = await (await request.get(settingsURL)).json();
  const response = await request.post(settingsURL, { data: { ...settings, productionTimezone: zone } });
  expect(response.ok()).toBe(true);
}

test.describe('display timezone', () => {
  test.beforeEach(async ({ request }) => {
    await setProductionTimezone(request, 'UTC');
  });

  test.afterEach(async ({ request }) => {
    await setProductionTimezone(request, null);
  });

  test('shifts scheduled times and flags the shift in the timeline view', async ({ page }) => {
    await page.goto('/editor');

    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('button', { name: 'Rundown menu' }).click();
    await page.getByRole('menuitem', { name: 'Clear all' }).click();
    await page.getByRole('button', { name: 'Delete all' }).click();
    await page.getByRole('button', { name: 'Create event' }).click();

    await page.getByTestId('rundown').getByPlaceholder('Start').click();
    await page.getByTestId('rundown').getByPlaceholder('Start').fill('10:00');
    await page.getByTestId('rundown').getByPlaceholder('Start').press('Enter');
    await page.getByTestId('rundown').getByPlaceholder('Duration').click();
    await page.getByTestId('rundown').getByPlaceholder('Duration').fill('30m');
    await page.getByTestId('rundown').getByPlaceholder('Duration').press('Enter');

    // show time is shown without a badge
    await page.goto('/timeline?timezone=plan');
    const timeline = page.getByTestId('timeline-view');
    await expect(timeline.getByText('10:00', { exact: true })).toBeVisible();
    await expect(page.getByTestId('timezone-badge')).toHaveCount(0);

    // a shifted view moves the scheduled time and says so
    await page.goto('/timeline?timezone=Asia/Kolkata');
    await expect(timeline.getByText('15:30', { exact: true })).toBeVisible();
    await expect(page.getByTestId('timezone-badge')).toContainText('Asia/Kolkata');
    await expect(page.getByTestId('timezone-badge')).toContainText('+5h30m');
    await expect(page.getByTestId('show-time-anchor')).toBeVisible();
  });
});
