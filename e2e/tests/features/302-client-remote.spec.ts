import { expect, test } from '@playwright/test';

test('redirect', async ({ context }) => {
  const controllerPage = await context.newPage();
  const remotePage = await context.newPage();

  await controllerPage.goto('http://localhost:4001/editor?settings=network__clients');
  await remotePage.goto('http://localhost:4001/timer');

  await controllerPage.getByTestId('not-self-redirect').click();
  await controllerPage.getByPlaceholder('newpath?and=params').click();
  await controllerPage.getByPlaceholder('newpath?and=params').fill('clock');
  await controllerPage.getByRole('button', { name: 'Submit' }).click();

  await expect(remotePage.getByTestId('clock-view')).toBeVisible();
});

test('identify', async ({ context }) => {
  const controllerPage = await context.newPage();
  const remotePage = await context.newPage();

  await controllerPage.goto('http://localhost:4001/editor?settings=network__clients');
  await remotePage.goto('http://localhost:4001/timer');

  await controllerPage.getByTestId('not-self-identify').click();

  await expect(remotePage.getByTestId('identify-overlay')).toBeVisible();
});

test('rename', async ({ context }) => {
  const controllerPage = await context.newPage();
  const remotePage = await context.newPage();

  await controllerPage.goto('http://localhost:4001/editor?settings=network__clients');
  await remotePage.goto('http://localhost:4001/timer');

  await controllerPage.getByTestId('not-self-rename').click();
  await controllerPage.getByPlaceholder('new name').click();
  await controllerPage.getByPlaceholder('new name').fill('test');
  await controllerPage.getByRole('button', { name: 'Submit' }).click();
  await controllerPage.getByTestId('not-self-identify').click();

  await expect(remotePage.getByTestId('identify-overlay')).toContainText('test');
});
