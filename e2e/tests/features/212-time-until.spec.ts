import { expect, test } from '@playwright/test';

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

  await countdown.goto(`/countdown?${ids.join('&sub=')}`);

  // Create reusable locator references for different elements
  const entry2 = {
    editorEvent: editor.getByTestId('entry-2').getByTestId('rundown-event'),
    opTimeUntil: op.getByTestId('2').getByTestId('time-until'),
    timelineItem: timeline.getByTestId('2'),
    timelineNext: timeline.getByTestId('next'),
    countdownItem: countdown.getByTestId('2'),
  };

  const entry3 = {
    editorEvent: editor.getByTestId('entry-3').getByTestId('rundown-event'),
    opTimeUntil: op.getByTestId('3').getByTestId('time-until'),
    timelineItem: timeline.getByTestId('3'),
    timelineFollowedBy: timeline.getByTestId('followedBy'),
    countdownItem: countdown.getByTestId('3'),
  };

  const entry4 = {
    editorEvent: editor.getByTestId('entry-4').getByTestId('rundown-event'),
    opTimeUntil: op.getByTestId('4').getByTestId('time-until'),
    timelineItem: timeline.getByTestId('4'),
    countdownItem: countdown.getByTestId('4'),
  };

  await editor.getByRole('button', { name: 'Absolute' }).click();
  await editor.getByTestId('entry-1').getByLabel('Start event').click();
  await expect(editor.getByTestId('offset')).not.toContainText('0:00'); // This might be a bad test requires that the test is not run at 0h
  await editor.getByLabel('Pause event').click();

  // 1. initial check
  await expect(entry2.editorEvent).toContainText('9m');
  await expect(entry2.opTimeUntil).toContainText('9m');
  await expect(entry2.timelineItem).toContainText('9m59s');
  await expect(entry2.timelineNext).toContainText('9m59s');
  await expect(entry2.countdownItem).toContainText('10:00');

  await expect(entry3.editorEvent).toContainText('19m');
  await expect(entry3.opTimeUntil).toContainText('19m');
  await expect(entry3.timelineItem).toContainText('19m');
  await expect(entry3.timelineFollowedBy).toContainText('19m');
  await expect(entry3.countdownItem).toContainText('19m');

  await expect(entry4.editorEvent).toContainText('29m');
  await expect(entry4.opTimeUntil).toContainText('29m');
  await expect(entry4.timelineItem).toContainText('29m');
  await expect(entry4.countdownItem).toContainText('29m');

  await editor.getByTestId('entry-1').getByTestId('time-input-duration').click();
  await editor.getByTestId('entry-1').getByTestId('time-input-duration').fill('6h');
  await editor.getByTestId('entry-1').getByTestId('time-input-duration').press('Enter');

  // 2. check after duration change
  await expect(entry2.editorEvent).toContainText('5h59m');
  await expect(entry2.opTimeUntil).toContainText('5h59m');
  await expect(entry2.timelineItem).toContainText('5h59m');
  await expect(entry2.timelineNext).toContainText('5h59m');
  await expect(entry2.countdownItem).toContainText('5h59m');

  await expect(entry3.editorEvent).toContainText('6h9m');
  await expect(entry3.opTimeUntil).toContainText('6h9m');
  await expect(entry3.timelineItem).toContainText('6h9m');
  await expect(entry3.timelineFollowedBy).toContainText('6h9m');
  await expect(entry3.countdownItem).toContainText('6h9m');

  await expect(entry4.editorEvent).toContainText('6h19m');
  await expect(entry4.opTimeUntil).toContainText('6h19m');
  await expect(entry4.timelineItem).toContainText('6h19m');
  await expect(entry4.countdownItem).toContainText('6h19m');

  await editor.getByTestId('entry-1').getByTestId('time-input-duration').click();
  await editor.getByTestId('entry-1').getByTestId('time-input-duration').fill('30s');
  await editor.getByTestId('entry-1').getByTestId('time-input-duration').press('Enter');

  await expect(editor.getByTestId('entry-2').getByTestId('rundown-event')).toContainText('30s');
  await expect(editor.getByTestId('entry-3').getByTestId('rundown-event')).toContainText('10m');
  await expect(editor.getByTestId('entry-4').getByTestId('rundown-event')).toContainText('20m');

  // 3. check after final duration change
  await expect(entry2.editorEvent).toContainText('30s');
  await expect(entry2.opTimeUntil).toContainText('30s');
  await expect(entry2.timelineItem).toContainText('30s');
  await expect(entry2.timelineNext).toContainText('30s');
  await expect(entry2.countdownItem).toContainText('0:30');

  await expect(entry3.editorEvent).toContainText('10m');
  await expect(entry3.opTimeUntil).toContainText('10m');
  await expect(entry3.timelineItem).toContainText('10m');
  await expect(entry3.timelineFollowedBy).toContainText('10m');
  await expect(entry3.countdownItem).toContainText('10m');

  await expect(entry4.editorEvent).toContainText('20m');
  await expect(entry4.opTimeUntil).toContainText('20m');
  await expect(entry4.timelineItem).toContainText('20m');
  await expect(entry4.countdownItem).toContainText('20m');
});

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
  await expect(editor.getByTestId('offset')).toContainText('0:00'); // This might be a bad test as it ruires the evaluation to happen within 1s
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
