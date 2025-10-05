import { expect, Locator, Page, test } from '@playwright/test';

test('time until absolute', async ({ context }) => {
  const editor = await context.newPage();
  const op = await context.newPage();
  const timeline = await context.newPage();
  const countdown = await context.newPage();
  await editor.goto('/editor');
  await op.goto('/op');
  await timeline.goto('/timeline');

  await editor.getByRole('button', { name: 'Clear all' }).click();
  await editor.getByRole('button', { name: 'Delete all' }).click();

  await editor.getByRole('button', { name: 'Create Event' }).click();
  await editor.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await editor.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await editor.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  await editor.getByTestId('entry-1').getByTestId('rundown-event').click();
  const ids = new Array<string>();
  ids.push(await editor.getByTestId('editor-container').getByLabel('Event ID (read only)').inputValue());
  await editor.getByTestId('entry-2').getByTestId('rundown-event').click();
  ids.push(await editor.getByTestId('editor-container').getByLabel('Event ID (read only)').inputValue());
  await editor.getByTestId('entry-3').getByTestId('rundown-event').click();
  ids.push(await editor.getByTestId('editor-container').getByLabel('Event ID (read only)').inputValue());
  await editor.getByTestId('entry-4').getByTestId('rundown-event').click();
  ids.push(await editor.getByTestId('editor-container').getByLabel('Event ID (read only)').inputValue());

  await countdown.goto('/countdown?' + ids.join('&sub='));

  const locatorElements2 = [
    editor.getByTestId('entry-2').getByTestId('rundown-event'),
    op.getByTestId('2').getByTestId('time-until'),
    timeline.getByTestId('2'),
    timeline.getByTestId('next'),
    countdown.getByTestId('2'),
  ];
  const locatorElements3 = [
    editor.getByTestId('entry-3').getByTestId('rundown-event'),
    op.getByTestId('3').getByTestId('time-until'),
    timeline.getByTestId('3'),
    timeline.getByTestId('followedBy'),
    countdown.getByTestId('3'),
  ];
  const locatorElements4 = [
    editor.getByTestId('entry-4').getByTestId('rundown-event'),
    op.getByTestId('4').getByTestId('time-until'),
    timeline.getByTestId('4'),
    countdown.getByTestId('4'),
  ];

  await editor.getByRole('button', { name: 'Absolute' }).click();
  await editor.getByTestId('entry-1').getByLabel('Start event').click();
  await expect(editor.getByTestId('offset')).not.toContainText('00:00:00'); // This might be a bad test requires that the test is not run at 0h
  await editor.getByLabel('Pause event').click();

  await testTimes(locatorElements2, '9m');
  await testTimes(locatorElements3, '19m');
  await testTimes(locatorElements4, '29m');

  await editor.getByTestId('entry-1').getByTestId('time-input-duration').click();
  await editor.getByTestId('entry-1').getByTestId('time-input-duration').fill('6h');
  await editor.getByTestId('entry-1').getByTestId('time-input-duration').press('Enter');

  await testTimes(locatorElements2, '5h59m');
  await testTimes(locatorElements3, '6h9m');
  await testTimes(locatorElements4, '6h19m');

  await editor.getByTestId('entry-1').getByTestId('time-input-duration').click();
  await editor.getByTestId('entry-1').getByTestId('time-input-duration').fill('30s');
  await editor.getByTestId('entry-1').getByTestId('time-input-duration').press('Enter');

  await expect(editor.getByTestId('entry-2').getByTestId('rundown-event')).toContainText('30s');
  await expect(editor.getByTestId('entry-3').getByTestId('rundown-event')).toContainText('10m');
  await expect(editor.getByTestId('entry-4').getByTestId('rundown-event')).toContainText('20m');

  await testTimes(locatorElements2, '30s');
  await testTimes(locatorElements3, '10m');
  await testTimes(locatorElements4, '20m');
});

async function testTimes(locators: Locator[], value: string) {
  await locators.map(async (locator) => await expect(locator).toContainText(value));
}

test('time until relative', async ({ context }) => {
  const editor = await context.newPage();
  editor.goto('http://localhost:4001/editor');

  await editor.getByRole('button', { name: 'Clear all' }).click();
  await editor.getByRole('button', { name: 'Delete all' }).click();

  await editor.getByRole('button', { name: 'Create Event' }).click();
  await editor.getByRole('button', { name: 'Event' }).nth(4).click();
  await editor.getByRole('button', { name: 'Event', exact: true }).nth(1).click();
  await editor.getByRole('button', { name: 'Event', exact: true }).nth(1).click();

  await editor.getByRole('button', { name: 'Relative' }).click();
  await editor.getByTestId('entry-1').getByLabel('Start event').click();
  await expect(editor.getByTestId('offset')).toContainText('00:00:00'); // This might be a bad test as it ruires the evaluation to happen within 1s
  await editor.getByLabel('Pause event').click();

  await expect(editor.getByTestId('entry-2').getByTestId('rundown-event')).toContainText('9m');
  await expect(editor.getByTestId('entry-3').getByTestId('rundown-event')).toContainText('19m');
  await expect(editor.getByTestId('entry-4').getByTestId('rundown-event')).toContainText('29m');

  await editor.getByTestId('entry-1').getByTestId('time-input-duration').click();
  await editor.getByTestId('entry-1').getByTestId('time-input-duration').fill('6h');
  await editor.getByTestId('entry-1').getByTestId('time-input-duration').press('Enter');

  await expect(editor.getByTestId('entry-2').getByTestId('rundown-event')).toContainText('5h59m');
  await expect(editor.getByTestId('entry-3').getByTestId('rundown-event')).toContainText('6h9m');
  await expect(editor.getByTestId('entry-4').getByTestId('rundown-event')).toContainText('6h19m');

  await editor.getByTestId('entry-1').getByTestId('time-input-duration').click();
  await editor.getByTestId('entry-1').getByTestId('time-input-duration').fill('30s');
  await editor.getByTestId('entry-1').getByTestId('time-input-duration').press('Enter');

  await expect(editor.getByTestId('entry-2').getByTestId('rundown-event')).toContainText('30s');
  await expect(editor.getByTestId('entry-3').getByTestId('rundown-event')).toContainText('10m');
  await expect(editor.getByTestId('entry-4').getByTestId('rundown-event')).toContainText('20m');

  await editor.getByRole('button', { name: 'Absolute' }).click();
});
