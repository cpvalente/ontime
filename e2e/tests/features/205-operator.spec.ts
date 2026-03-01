import { expect, test } from '@playwright/test';

test('smoke test operator', async ({ page }) => {
  // make some boilerplate
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('button', { name: 'Rundown menu' }).click();
  await page.getByRole('menuitem', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();
  await page.getByRole('button', { name: 'Create Group' }).click();
  await page.getByTestId('rundown-group').getByTestId('entry__title').click();
  await page.getByTestId('rundown-group').getByTestId('entry__title').fill('group 1');
  await page.getByTestId('rundown-group').getByTestId('entry__title').press('Enter');

  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  await page.getByTestId('time-input-timeStart').fill('1m');
  await page.getByTestId('time-input-timeStart').press('Enter');
  await page.getByTestId('time-input-duration').fill('1m');
  await page.getByTestId('time-input-duration').press('Enter');

  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await page.getByTestId('entry-2').getByTestId('lock__duration').click();
  await page.getByTestId('entry-2').getByTestId('time-input-duration').fill('1m');
  await page.getByTestId('entry-2').getByTestId('time-input-duration').press('Enter');
  await page.getByTestId('entry-2').getByTestId('time-input-duration').press('Enter');

  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await page.getByTestId('entry-3').getByTestId('lock__duration').click();
  await page.getByTestId('entry-3').getByTestId('time-input-duration').fill('1m');
  await page.getByTestId('entry-3').getByTestId('time-input-duration').press('Enter');

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByTestId('entry-1').click();
  await page.getByTestId('editor-container').getByLabel('Cue').fill('--1');
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  await page.getByTestId('entry-1').getByTestId('entry__title').click();
  await page.getByTestId('entry-1').getByTestId('entry__title').fill('title 1');
  await page.getByTestId('entry-1').getByTestId('entry__title').press('Enter');

  await page.getByTestId('entry-2').click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  await page.getByTestId('entry-2').getByTestId('entry__title').click();
  await page.getByTestId('entry-2').getByTestId('entry__title').fill('title 2');
  await page.getByTestId('entry-2').getByTestId('entry__title').press('Enter');

  await page.getByTestId('entry-3').click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  await page.getByTestId('entry-3').getByTestId('entry__title').click();
  await page.getByTestId('entry-3').getByTestId('entry__title').fill('title 3');
  await page.getByTestId('entry-3').getByTestId('entry__title').press('Enter');

  // start an event
  await page.getByTestId('panel-timer-control').getByRole('button', { name: 'Start' }).click();

  await page.goto('/op');

  await expect(page.getByText('group 1')).toBeInViewport();
  await expect(page.getByText('title 1')).toBeInViewport();
  await expect(page.getByTestId('--1')).toHaveCSS('opacity', '1'); // BUG: ensure event doesn't inherit the past state of the group
  await expect(page.getByText('title 2')).toBeInViewport();
  await expect(page.getByText('title 3')).toBeInViewport();
});
