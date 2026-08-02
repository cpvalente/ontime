import { expect, test } from '@playwright/test';

test('redirect', async ({ context }) => {
  const controllerPage = await context.newPage();
  const remotePage = await context.newPage();

  await controllerPage.goto('/editor?settings=network__clients');
  await remotePage.goto('/timer');

  await controllerPage.getByTestId('not-self-redirect').click();
  await controllerPage.getByRole('textbox', { name: 'http://localhost:' }).click();
  await controllerPage.getByRole('textbox', { name: 'http://localhost:' }).fill('studio');
  await controllerPage.getByLabel('Redirect', { exact: true }).click();

  await expect(remotePage.getByTestId('studio-view')).toBeVisible();
});

test('identify', async ({ context }) => {
  const controllerPage = await context.newPage();
  const remotePage = await context.newPage();

  await controllerPage.goto('/editor?settings=network__clients');
  await remotePage.goto('/timer');

  await controllerPage.getByTestId('not-self-identify').click();

  await expect(remotePage.getByTestId('identify-overlay')).toBeVisible();
});

test('rename', async ({ context }) => {
  const controllerPage = await context.newPage();
  const remotePage = await context.newPage();

  await controllerPage.goto('/editor?settings=network__clients');
  await remotePage.goto('/timer');

  await controllerPage.getByTestId('not-self-rename').click();
  await controllerPage.getByPlaceholder('new name').click();
  await controllerPage.getByPlaceholder('new name').fill('test');
  await controllerPage.getByRole('button', { name: 'Submit' }).click();
  await controllerPage.getByTestId('not-self-identify').click();

  await expect(remotePage.getByTestId('identify-overlay')).toContainText('test');
});

/**
 * The view select in the redirect modal lists the built-in Ontime views alongside any URL
 * presets. It used to be disabled whenever no presets existed, which left a fresh project
 * unable to redirect to a view at all. Strip the presets to cover that case.
 */
test('redirect to a built-in view with no url presets', async ({ context, request }) => {
  const presetsUrl = '/data/url-presets';
  const existingPresets = await (await request.get(presetsUrl)).json();

  for (const preset of existingPresets) {
    await request.delete(`${presetsUrl}/${preset.alias}`);
  }

  try {
    const controllerPage = await context.newPage();
    const remotePage = await context.newPage();

    await controllerPage.goto('/editor?settings=network__clients');
    await remotePage.goto('/timer');

    await controllerPage.getByTestId('not-self-redirect').click();

    // the select and its action stay usable even though there is nothing to pick from presets
    const viewSelect = controllerPage.getByRole('combobox');
    await expect(viewSelect).toBeEnabled();

    await viewSelect.click();
    await controllerPage.getByRole('option', { name: 'Studio Clock', exact: true }).click();

    const redirectToView = controllerPage.getByLabel('Redirect to preset');
    await expect(redirectToView).toBeEnabled();
    await redirectToView.click();

    await expect(remotePage.getByTestId('studio-view')).toBeVisible();
  } finally {
    // leave the project as we found it for any spec that runs after this one
    for (const preset of existingPresets) {
      await request.post(presetsUrl, { data: preset });
    }
  }
});
