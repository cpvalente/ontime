export const dataFromExcelTemplate = [
  ['Ontime ┬À Schedule Template'],
  [],
  [
    'id',
    'Time Start',
    'Time End',
    'Title',
    'End Action',
    'Timer type',
    'Count to end',
    'Skip',
    'Notes',
    't0',
    'Test1',
    'test2',
    'test3',
    'Colour',
    'cue',
  ],
  [
    'event-a', // <-- eventId
    '07:00:00', // <-- timeStart
    '08:00:10', // <-- timeEnd
    'Guest Welcome', // <-- title
    '', // <-- endAction
    '', // <-- timerType
    'x', // <-- count to end
    '', // <-- skip
    'Ballyhoo', // <-- notes
    'a0', // <-- t0
    'a1', // <-- test1
    'a2', // <-- test2
    'a3', // <-- test3
    'red', // <-- colour
    101, // <-- cue
  ],
  [
    'event-b', // <-- eventId
    '08:00:00', // <-- timeStart
    '08:30:00', // <-- timeEnd
    'A song from the hearth', // <-- title
    'load-next', // <-- endAction
    'clock', // timerType
    'x', // <-- count to end
    'x', // <-- skip
    'Rainbow chase', // <-- notes
    'b0', // <-- t0
    '', // <-- test1
    '', // <-- test2
    '', // <-- test3
    '#F00', // <-- colour
    102, // <-- cue
  ],
  [],
];
