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
  await page.getByTestId('rundown-event').locator('div').filter({ hasText: '4' }).click();
  await page.getByTestId('rundown-event').locator('div').filter({ hasText: '4' }).press('Control+c');
  await page.getByTestId('rundown-event').locator('div').filter({ hasText: '4' }).press('Control+v');

  // assert
  await expect(page.getByTestId('entry-2')).toBeVisible();
  await expect(page.getByTestId('entry-2').getByTestId('block__title')).toHaveValue('test');
  await expect(page.getByTestId('entry-2').getByTestId('rundown-event')).toContainText('5');

  // copy paste above
  await page.getByTestId('rundown-event').locator('div').filter({ hasText: '5' }).click();
  await page.getByTestId('rundown-event').locator('div').filter({ hasText: '5' }).press('Control+c');
  await page.getByTestId('rundown-event').locator('div').filter({ hasText: '5' }).press('Control+Shift+v');

  // assert
  await expect(page.getByTestId('entry-2')).toBeVisible();
  await expect(page.getByTestId('entry-2').getByTestId('block__title')).toHaveValue('test');
  await expect(page.getByTestId('entry-2').getByTestId('rundown-event')).toContainText('4.1');
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
  await page.getByTestId('entry-1').getByTestId('rundown-event').getByText('1').click();
  await page
    .getByTestId('entry-1')
    .getByTestId('rundown-event')
    .filter({ hasText: '1' })
    .press('Alt+Control+ArrowDown');
  await expect(page.getByTestId('entry-2').getByTestId('rundown-event')).toContainText('1');

  // copy move up
  await page.getByTestId('entry-3').getByTestId('rundown-event').getByText('3').click();
  await page.getByTestId('entry-3').getByTestId('rundown-event').filter({ hasText: '3' }).press('Alt+Control+ArrowUp');
  await page.getByTestId('entry-3').getByTestId('rundown-event').filter({ hasText: '3' }).press('Alt+Control+ArrowUp');
  await expect(page.getByTestId('entry-1').getByTestId('rundown-event')).toContainText('3');
});

test('Add block', async ({ page }) => {
  await page.goto('http://localhost:4001/rundown');

  // clear rundown
  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();
  await expect(page.getByTestId('rundown-event')).toHaveCount(0);
  await expect(page.getByTestId('rundown-block')).toHaveCount(0);

  // create events
  await page.getByRole('button', { name: 'Create Event' }).click();
  await expect(page.getByTestId('rundown-event')).toHaveCount(1);
  await expect(page.getByTestId('rundown-block')).toHaveCount(0);
  await page.getByPlaceholder(/event title/i).fill('test');
  await page.getByTestId('entry-1').click();

  // add block below
  await page.getByTestId('rundown-event').locator('div').filter({ hasText: '1' }).press('Alt+G');
  await expect(page.getByTestId('rundown-event')).toHaveCount(1);
  await expect(page.getByTestId('rundown-block')).toHaveCount(1);
  await page.getByTestId('rundown-block').getByTestId('block__title').fill('block below');

  // add block above
  await page.getByTestId('rundown-event').locator('div').filter({ hasText: '1' }).press('Alt+Shift+G');
  await expect(page.getByTestId('rundown-event')).toHaveCount(1);
  await expect(page.getByTestId('rundown-block')).toHaveCount(2);
  await page.getByTestId('block__title').first().fill('block above');

  await expect(page.getByTestId(/block__title/i).first()).toHaveValue('block above');
  await expect(page.getByTestId(/block__title/i).nth(2)).toHaveValue('block below');
  await expect(page.getByTestId('entry-1').getByTestId(/block__title/)).toHaveValue('test');
});

test('Add delay', async ({ page }) => {
  await page.goto('http://localhost:4001/rundown');

  // clear rundown
  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();
  await expect(page.getByTestId('rundown-event')).toHaveCount(0);
  await expect(page.getByTestId('rundown-delay')).toHaveCount(0);

  //create events
  await page.getByRole('button', { name: 'Create Event' }).click();
  await expect(page.getByTestId('rundown-event')).toHaveCount(1);
  await expect(page.getByTestId('rundown-delay')).toHaveCount(0);
  await page.getByTestId('entry-1').click();
  await page.getByTestId('block__title').press('Escape');

  //add delay below
  await page.getByTestId('rundown-event').locator('div').filter({ hasText: '1' }).press('Alt+D');
  await expect(page.getByTestId('rundown-event')).toHaveCount(1);
  await expect(page.getByTestId('rundown-delay')).toHaveCount(1);
  await expect(page.getByTestId('delay-input')).toBeVisible();

  //add delay above
  await page.getByTestId('rundown-event').locator('div').filter({ hasText: '1' }).press('Alt+Shift+D');
  await expect(page.getByTestId('rundown-event')).toHaveCount(1);
  await expect(page.getByTestId('rundown-delay')).toHaveCount(2);
  await expect(page.getByTestId('entry-0').getByTestId('delay-input')).toBeVisible();
});

test('Add event', async ({ page }) => {
  await page.goto('http://localhost:4001/rundown');

  // clear rundown
  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();
  await expect(page.getByTestId('rundown-event')).toHaveCount(0);

  //create events
  await page.getByRole('button', { name: 'Create Event' }).click();
  await expect(page.getByTestId('rundown-event')).toHaveCount(1);
  await page.getByTestId('entry-1').click();
  await page.getByTestId('block__title').press('Escape');

  //add event below
  await page.getByTestId('rundown-event').locator('div').filter({ hasText: '1' }).press('Alt+E');
  await expect(page.getByTestId('rundown-event')).toHaveCount(2);
  await expect(page.getByTestId('entry-2').getByTestId('rundown-event').getByText('2')).toBeVisible();

  //add event above
  await page.getByTestId('rundown-event').locator('div').filter({ hasText: '1' }).press('Alt+Shift+E');
  await expect(page.getByTestId('rundown-event')).toHaveCount(3);
  await expect(page.getByTestId('entry-1').getByTestId('rundown-event')).toContainText('0.1');
});

test('Delete event', async ({ page }) => {
  await page.goto('http://localhost:4001/rundown');

  // clear rundown
  await page.goto('http://localhost:4001/rundown');
  await page.getByRole('button', { name: 'Clear all' }).click();
  await page.getByRole('button', { name: 'Delete all' }).click();
  await expect(page.getByTestId('rundown-event')).toHaveCount(0);

  //create event
  await page.getByRole('button', { name: 'Create Event' }).click();
  await expect(page.getByTestId('rundown-event')).toHaveCount(1);

  //delete event
  await page.getByTestId('rundown-event').locator('div').filter({ hasText: '1' }).click();
  await page.getByTestId('rundown-event').locator('div').filter({ hasText: '1' }).press('Alt+Backspace');
  await expect(page.getByTestId('rundown-event')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Create Event' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Group' })).toBeVisible();
});
