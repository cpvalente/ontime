import { test, expect } from '@playwright/test';

test('Copy-paste', async ({ page }) => {
  await page.goto('http://localhost:4001/rundown');

  // clear rundown
  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  // create event
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByTestId('entry-1').click();
  await page.getByLabel('Cue', { exact: true }).click();
  await page.getByLabel('Cue', { exact: true }).fill('4');
  await page.getByLabel('Cue', { exact: true }).press('Enter');
  await page.getByTestId('entry-1').click();
  await page.getByTestId('block__title').click();
  await page.getByTestId('block__title').fill('test');
  await page.getByTestId('block__title').press('Enter');

  // copy paste below
  await page.locator('div').filter({ hasText: /^4$/ }).click();
  await page.locator('div').filter({ hasText: /^4$/ }).press('Control+c');
  await page.locator('div').filter({ hasText: /^4$/ }).press('Control+v');

  // assert
  await expect(page.getByTestId('entry-2')).toBeVisible();
  await expect(page.getByTestId('entry-2').getByTestId('block__title')).toHaveValue('test');
  await expect(page.getByTestId('entry-2').locator('#event-block')).toContainText('5');

  // copy paste above
  await page.locator('div').filter({ hasText: /^5$/ }).click();
  await page.locator('div').filter({ hasText: /^5$/ }).press('Control+c');
  await page.locator('div').filter({ hasText: /^5$/ }).press('Control+Shift+v');

  // assert
  await expect(page.getByTestId('entry-2')).toBeVisible();
  await expect(page.getByTestId('entry-2').getByTestId('block__title')).toHaveValue('test');
  await expect(page.getByTestId('entry-2').locator('#event-block')).toContainText('4.1');
});

test('Move', async ({ page }) => {
  await page.goto('http://localhost:4001/rundown');

  // clear rundown
  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  // create events
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('button', { name: 'Event' }).nth(4).click();
  await page.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  // copy move down
  await page.getByTestId('entry-1').locator('#event-block').getByText('1').click();
  await page.getByTestId('entry-1').locator('#event-block div').filter({ hasText: '1' }).press('Alt+Control+ArrowDown');
  await expect(page.getByTestId('entry-2').locator('#event-block')).toContainText('1');

  // copy move up
  await page.getByTestId('entry-3').locator('#event-block').getByText('3').click();
  await page.getByTestId('entry-3').locator('#event-block div').filter({ hasText: '3' }).press('Alt+Control+ArrowUp');
  await page.getByTestId('entry-2').locator('div').filter({ hasText: /^3$/ }).press('Alt+Control+ArrowUp');
  await expect(page.getByTestId('entry-1').locator('#event-block')).toContainText('3');
});

test('Add block', async ({ page }) => {
  await page.goto('http://localhost:4001/rundown');

  // clear rundown
  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  // create events
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByPlaceholder(/event title/i).fill('test');
  await page.getByTestId('entry-1').click();

  // add block below
  await page.getByTestId('entry-1').locator('#event-block div').filter({ hasText: '1' }).press('Alt+B');
  await page.getByPlaceholder(/block title/i).fill('block below');

  // add block above
  await page.getByTestId('entry-1').locator('#event-block div').filter({ hasText: '1' }).press('Alt+Shift+B');
  await page
    .getByPlaceholder(/block title/i)
    .first()
    .fill('block above');

  await expect(page.getByTestId(/block__title/i).first()).toHaveValue('block above');
  await expect(page.getByTestId(/block__title/i).nth(2)).toHaveValue('block below');
  await expect(page.getByTestId('entry-1').getByTestId(/block__title/)).toHaveValue('test');
});

test('Add delay', async ({ page }) => {
  await page.goto('http://localhost:4001/rundown');

  // clear rundown
  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  //create events
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByTestId('entry-1').click();
  await page.getByTestId('block__title').press('Escape');

  //add delay below
  await page.getByTestId('entry-1').locator('#event-block div').filter({ hasText: '1' }).press('Alt+D');
  await expect(page.getByTestId('delay-input')).toBeVisible();

  //add delay above
  await page.getByTestId('entry-1').locator('#event-block div').filter({ hasText: '1' }).press('Alt+Shift+D');
  await expect(page.getByTestId('entry-0').getByTestId('delay-input')).toBeVisible();
});

test('Add event', async ({ page }) => {
  await page.goto('http://localhost:4001/rundown');

  // clear rundown
  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  //create events
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByTestId('entry-1').click();
  await page.getByTestId('block__title').press('Escape');

  //add event below
  await page.getByTestId('entry-1').locator('#event-block div').filter({ hasText: '1' }).press('Alt+E');
  await expect(page.getByTestId('entry-2').locator('#event-block').getByText('2')).toBeVisible();

  //add event above
  await page.getByTestId('entry-1').locator('#event-block div').filter({ hasText: '1' }).press('Alt+Shift+E');
  await expect(page.getByTestId('entry-1').locator('#event-block')).toContainText('0.1');
});

test('Delete event', async ({ page }) => {
  await page.goto('http://localhost:4001/rundown');

  // clear rundown
  await page.goto('http://localhost:4001/rundown');
  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();

  //create event
  await page.getByRole('button', { name: 'Create Event' }).click();

  //delete event
  await page.locator('#event-block div').filter({ hasText: '1' }).click();
  await page.getByTestId('entry-1').locator('#event-block div').filter({ hasText: '1' }).press('Alt+Backspace');
  await expect(page.getByRole('button', { name: 'Create Event' })).toBeVisible();
});
