import { expect, test } from '@playwright/test';

test('redirect', async ({ context }) => {
  const controllerPage = await context.newPage();
  const remotePage = await context.newPage();

  await controllerPage.goto('/editor?settings=network__clients');
  await remotePage.goto('/timer');

  const remoteClient = controllerPage.getByRole('row').filter({ hasText: /\/timer/ });
  await remoteClient.getByTestId('not-self-redirect').click();
  await controllerPage.getByRole('textbox', { name: 'http://localhost:' }).click();
  await controllerPage.getByRole('textbox', { name: 'http://localhost:' }).fill('studio');
  await controllerPage.getByRole('button', { name: 'Redirect to custom path' }).click();

  await expect(remotePage.getByTestId('studio-view')).toBeVisible();
});

test('identify', async ({ context }) => {
  const controllerPage = await context.newPage();
  const remotePage = await context.newPage();

  await controllerPage.goto('/editor?settings=network__clients');
  await remotePage.goto('/timer');

  await controllerPage
    .getByRole('row')
    .filter({ hasText: /\/timer/ })
    .getByTestId('not-self-identify')
    .click();

  await expect(remotePage.getByTestId('identify-overlay')).toBeVisible();
});

test('rename', async ({ context }) => {
  const controllerPage = await context.newPage();
  const remotePage = await context.newPage();

  await controllerPage.goto('/editor?settings=network__clients');
  await remotePage.goto('/timer');

  await controllerPage
    .getByRole('row')
    .filter({ hasText: /\/timer/ })
    .getByTestId('not-self-rename')
    .click();
  await controllerPage.getByPlaceholder('new name').click();
  await controllerPage.getByPlaceholder('new name').fill('test');
  await controllerPage.getByRole('button', { name: 'Submit' }).click();
  await controllerPage
    .getByRole('row')
    .filter({ hasText: /\/timer/ })
    .getByTestId('not-self-identify')
    .click();

  await expect(remotePage.getByTestId('identify-overlay')).toContainText('test');
});
