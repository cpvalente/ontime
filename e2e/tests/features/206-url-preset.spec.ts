import { expect, test } from '@playwright/test';

const aliasName = 'testing';
const aliasUrl =
  'www.getontime.no/team/timer/?hideTimerSeconds=true&showLeadingZeros=true&freezeOvertime=true&hidePhase=true&hideClock=true&hideCards=true&hideProgress=true&hideMessage=true&hideSecondary=true&hideLogo=true';

test.describe('URL Preset', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://localhost:4001/editor');

    // Create the preset that will be used by other tests
    await page.getByRole('button', { name: 'Toggle settings' }).click();
    await page.getByRole('button', { name: 'URL Presets' }).click();

    await page.getByRole('heading', { name: 'URL presets New' }).getByRole('button').scrollIntoViewIfNeeded();
    await page.getByRole('heading', { name: 'URL presets New' }).getByRole('button').click();

    await page.locator('input[name="alias"]').click();
    await page.locator('input[name="alias"]').fill(aliasName);

    await page.getByRole('textbox', { name: 'Paste URL' }).click();
    await page.getByRole('textbox', { name: 'Paste URL' }).fill(aliasUrl);
    await page.getByRole('button', { name: 'Generate' }).click();

    await page.getByRole('combobox').filter({ hasText: 'Timer' });
    await page.getByRole('button', { name: 'Save' }).click();

    await page.close();
  });

  test('Unwrapping a preset from a view', async ({ page }) => {
    await page.goto('http://localhost:4001/timer');

    // 1. the URL points to the view
    expect(page.url().includes('hideTimerSeconds=true')).not.toBeTruthy();
    expect(page.url().includes('alias=testing')).not.toBeTruthy();

    // open settings
    await page.getByRole('button', { name: 'Toggle settings' }).click();
    await page
      .locator('div')
      .filter({ hasText: /^testingApply$/ })
      .getByRole('button')
      .click();
    await expect(page.getByRole('button', { name: 'Applied' })).toBeVisible();

    // 2. the URL contains the preset
    expect(page.url().includes('hideTimerSeconds=true')).toBeTruthy();
    expect(page.url().includes('alias=testing')).toBeTruthy();
  });

  test('Sharing a link to an unwrapped preset', async ({ page }) => {
    await page.goto('http://localhost:4001/editor');

    // open settings
    await page.getByRole('button', { name: 'Toggle settings' }).click();
    await page.getByRole('button', { name: 'Share link' }).click();

    // select options
    await page.getByRole('combobox').filter({ hasText: 'Timer' }).click();
    await page.getByText('URL Preset: testing').click();

    // create and verify link
    await page.getByRole('button', { name: 'Create share link' }).click();
    await expect(page.getByTestId('copy-link')).toContainText('testing');
    await expect(page.getByTestId('copy-link')).not.toContainText('n=1');

    // verify the preset
    const generatedUrl = await page.getByTestId('copy-link').textContent();
    await page.goto(generatedUrl);

    // make sure preset works in mask mode
    await expect(page.getByTestId('timer-view')).toBeVisible();
    // the url unwraps the preset
    expect(page.url().includes('hideTimerSeconds=true')).toBeTruthy();
    expect(page.url().includes('alias=testing')).toBeTruthy();
    expect(page.url().includes('/preset/testing')).not.toBeTruthy();

    // the menus work
    await expect(page.getByTestId('navigation__toggle-settings')).toBeVisible();
  });

  test('Sharing a link to a masked preset', async ({ page }) => {
    await page.goto('http://localhost:4001/editor');

    // open settings
    await page.getByRole('button', { name: 'Toggle settings' }).click();
    await page.getByRole('button', { name: 'Share link' }).click();

    // select options
    await page.getByRole('combobox').filter({ hasText: 'Timer' }).click();
    await page.getByText('URL Preset: testing').click();
    await page.getByTestId('lockNav').click();
    await page.getByTestId('lockConfig').click();

    // create and verify link
    await page.getByRole('button', { name: 'Create share link' }).click();
    await expect(page.getByTestId('copy-link')).toContainText('/preset/testing');
    await expect(page.getByTestId('copy-link')).toContainText('/preset/testing');
    await expect(page.getByTestId('copy-link')).toContainText('n=1');

    // verify the preset
    const generatedUrl = await page.getByTestId('copy-link').textContent();
    await page.goto(generatedUrl);

    // make sure preset works in mask mode
    await expect(page.getByTestId('timer-view')).toBeVisible();
    // the url masks the preset
    expect(page.url().includes('hideTimerSeconds=true')).not.toBeTruthy();
    expect(page.url().includes('alias=testing')).not.toBeTruthy();
    expect(page.url().includes('/preset/testing')).toBeTruthy();
  });
});

test.describe('Sharing from cuesheet', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://localhost:4001/editor');

    // we create some elements to test with
    await page.getByRole('button', { name: 'Clear all' }).click();
    await page.getByRole('button', { name: 'Delete all' }).click();
    await page.getByRole('button', { name: 'Create Event' }).click();
    await page.getByTestId('entry-1').getByTestId('entry__title').click();
    await page.getByTestId('entry-1').getByTestId('entry__title').fill('title 1');
    await page.getByTestId('entry-1').getByTestId('entry__title').press('Enter');

    await page.close();
  });

  test('Sharing a link with readonly permissions', async ({ page }) => {
    await page.goto('http://localhost:4001/cuesheet');
    await expect(page.getByTestId('cuesheet')).toBeVisible();

    await page.getByRole('button', { name: 'Share...' }).click();

    // configure share for readonly
    await page.getByRole('textbox').fill('cuesheet-read-test');
    await page.getByText('Custom write').click();
    await page.getByText('Custom read').click();
    await page.getByTestId('lockNav').click();
    await page.getByTestId('write-flag').click();
    await page.getByTestId('write-cue').click();
    await page.getByTestId('write-title').click();
    await page.getByTestId('write-timeStart').click();
    await page.getByTestId('write-timeEnd').click();
    await page.getByTestId('write-duration').click();
    await page.getByTestId('write-note').click();

    // create and verify link
    await page.getByRole('button', { name: 'Create share link' }).click();
    await expect(page.getByTestId('copy-link')).toContainText('preset/cuesheet-read-test');
    await expect(page.getByTestId('copy-link')).toContainText('n=1');

    // verify the preset
    const generatedUrl = await page.getByTestId('copy-link').textContent();
    await page.goto(generatedUrl);

    // the menu is locked and we cant make shares
    await expect(page.getByTestId('cuesheet')).toBeVisible();
    await expect(page.getByTestId('navigation__toggle-settings')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Share...' })).toBeHidden();

    // check that we are locked and cannot edit
    await page.getByRole('button', { name: 'Edit' }).click();

    // Verify that the title is visible but not editable
    await expect(page.getByTestId('cuesheet-event').getByText('title 1')).toBeVisible();
    await expect(page.getByTestId('cuesheet-event').locator('input')).toBeHidden();

    // other elements are still there
    await expect(page.getByRole('cell', { name: 'Duration' })).toBeVisible();
  });

  test('Sharing a link with scoped read-write permissions', async ({ page }) => {
    await page.goto('http://localhost:4001/cuesheet');
    await expect(page.getByTestId('cuesheet')).toBeVisible();

    await page.getByRole('button', { name: 'Share...' }).click();

    // configure share for readonly
    await page.getByRole('textbox').fill('cuesheet-scope-test');
    await page.getByText('Custom write').click();
    await page.getByText('Custom read').click();
    await page.getByTestId('lockNav').click();
    await page.getByTestId('write-flag').click();
    await page.getByTestId('write-cue').click();
    await page.getByTestId('write-timeStart').click();
    await page.getByTestId('write-timeEnd').click();
    await page.getByTestId('write-duration').click();
    await page.getByTestId('write-note').click();
    await page.getByTestId('read-flag').click();
    await page.getByTestId('read-cue').click();
    await page.getByTestId('read-timeStart').click();
    await page.getByTestId('read-timeEnd').click();
    await page.getByTestId('read-duration').click();
    await page.getByTestId('read-note').click();

    // create and verify link
    await page.getByRole('button', { name: 'Create share link' }).click();
    await expect(page.getByTestId('copy-link')).toContainText('preset/cuesheet-scope-test');
    await expect(page.getByTestId('copy-link')).toContainText('n=1');

    // verify the preset
    const generatedUrl = await page.getByTestId('copy-link').textContent();
    await page.goto(generatedUrl);

    // the menu is locked and we cant make shares
    await expect(page.getByTestId('cuesheet')).toBeVisible();
    await expect(page.getByTestId('navigation__toggle-settings')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Share...' })).toBeHidden();

    // check that we are locked and cannot edit
    await page.getByRole('button', { name: 'Edit' }).click();

    // Verify that the title is visible and editable
    await expect(page.getByTestId('cuesheet-event').getByRole('cell', { name: 'title' })).toBeVisible();

    // other elements are not there
    await expect(page.getByRole('cell', { name: 'Duration' })).toBeHidden();
  });
});
