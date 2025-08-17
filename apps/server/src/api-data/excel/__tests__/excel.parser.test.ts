import { CustomFields, OntimeEvent, OntimeGroup, SupportedEntry, TimerType } from 'ontime-types';
import { defaultImportMap, ImportMap, MILLIS_PER_MINUTE } from 'ontime-utils';

import { getCustomFieldData, parseExcel } from '../excel.parser.js';

import { dataFromExcelTemplate } from './mockData.js';

describe('parseExcel()', () => {
  it('parses the example file', () => {
    // partial import map with only custom fields
    const importMap = {
      custom: {
        user0: 't0',
        user1: 'Test1',
        user2: 'test2',
        user3: 'test3',
      },
    };

    const existingCustomFields: CustomFields = {
      user0: { type: 'text', colour: 'red', label: 'user0' },
      user1: { type: 'text', colour: 'green', label: 'user1' },
      user2: { type: 'text', colour: 'blue', label: 'user2' },
    };

    const parsedData = parseExcel(dataFromExcelTemplate, existingCustomFields, 'testSheet', importMap);
    expect(parsedData.customFields).toStrictEqual({
      user0: {
        type: 'text',
        colour: 'red',
        label: 'user0',
      },
      user1: {
        type: 'text',
        colour: 'green',
        label: 'user1',
      },
      user2: {
        type: 'text',
        colour: 'blue',
        label: 'user2',
      },
      user3: {
        type: 'text',
        colour: '',
        label: 'user3',
      },
    });
    expect(parsedData.rundown.order.length).toBe(2);
    // TODO: why dont we parse the date in UTC?
    expect(parsedData.rundown.entries).toMatchObject({
      'event-a': {
        id: 'event-a',
        //timeStart: 28800000,
        //timeEnd: 32410000,
        title: 'Guest Welcome',
        timerType: 'count-down',
        endAction: 'none',
        skip: false,
        note: 'Ballyhoo',
        custom: {
          user0: 'a0',
          user1: 'a1',
          user2: 'a2',
          user3: 'a3',
        },
        colour: 'red',
        type: 'event',
        cue: '101',
      },
      'event-b': {
        id: 'event-b',
        //timeStart: 32400000,
        //timeEnd: 34200000,
        title: 'A song from the hearth',
        timerType: 'clock',
        endAction: 'load-next',
        skip: true,
        note: 'Rainbow chase',
        custom: {},
        colour: '#F00',
        type: 'event',
        cue: '102',
      },
    });
  });

  it('parses a file without custom fields', () => {
    // partial import map with only custom fields
    const importMap = {
      custom: {
        niu1: 'niu1',
        niu2: 'niu2',
      },
    };

    const parsedData = parseExcel(dataFromExcelTemplate, {}, 'testSheet', importMap);
    expect(parsedData.customFields).toStrictEqual({
      niu1: {
        type: 'text',
        colour: '',
        label: 'niu1',
      },
      niu2: {
        type: 'text',
        colour: '',
        label: 'niu2',
      },
    });
    expect(parsedData.rundown.order).toMatchObject(['event-a', 'event-b']);
    expect(parsedData.rundown.entries['event-a']).toMatchObject({
      //timeStart: 28800000,
      //timeEnd: 32410000,
      id: 'event-a',
      title: 'Guest Welcome',
      timerType: 'count-down',
      endAction: 'none',
      skip: false,
      note: 'Ballyhoo',
      custom: {},
      colour: 'red',
      type: 'event',
      cue: '101',
    });
    expect(parsedData.rundown.entries['event-b']).toMatchObject({
      //timeStart: 32400000,
      //timeEnd: 34200000,
      id: 'event-b',
      title: 'A song from the hearth',
      timerType: 'clock',
      endAction: 'load-next',
      skip: true,
      note: 'Rainbow chase',
      custom: {},
      colour: '#F00',
      type: 'event',
      cue: '102',
    });
  });

  it('ignores unknown event types', () => {
    const testdata = [
      ['Title', 'Timer type'],
      ['Guest Welcome', 'x'],
      ['A song from the hearth', 'clock'],
    ];

    const importMap = {
      title: 'title',
      timerType: 'timer type',
    };
    const result = parseExcel(testdata, {}, 'testSheet', importMap);
    const firstEvent = result.rundown.entries[result.rundown.order[0]];

    expect(result.rundown.order.length).toBe(1);
    expect((firstEvent as OntimeEvent).title).toBe('A song from the hearth');
  });

  it('imports group', () => {
    const testdata = [
      ['Title', 'Timer type', 'duration'],
      ['a group', 'group', '10m'],
      ['an event', 'clock', '1m'],
    ];

    const importMap = {
      title: 'title',
      timerType: 'timer type',
      duration: 'duration',
    } as ImportMap;

    const result = parseExcel(testdata, {}, 'testSheet', importMap);
    const firstGroup = result.rundown.entries[result.rundown.order[0]];

    expect(result.rundown.order.length).toBe(1);
    expect(result.rundown.flatOrder.length).toBe(2);
    expect((firstGroup as OntimeGroup).type).toBe(SupportedEntry.Group);
    expect((firstGroup as OntimeGroup).targetDuration).toBe(10 * MILLIS_PER_MINUTE);
  });

  it('places event between groups inside the group', () => {
    const testdata = [
      ['Title', 'Timer type'],
      ['a group', 'group'],
      ['an event', 'clock'],
      ['an event', 'clock'],
      ['an event', 'clock'],
      ['a second group ', 'group'],
      ['an event', 'clock'],
      ['an event', 'clock'],
    ];

    const importMap = {
      title: 'title',
      timerType: 'timer type',
    };
    const result = parseExcel(testdata, {}, 'testSheet', importMap);
    const firstGroup = result.rundown.entries[result.rundown.order[0]] as OntimeGroup;
    const secondGroup = result.rundown.entries[result.rundown.order[1]] as OntimeGroup;

    expect(result.rundown.order.length).toBe(2);
    expect(result.rundown.flatOrder.length).toBe(7);

    expect(firstGroup.type).toBe(SupportedEntry.Group);
    expect(firstGroup.entries.length).toBe(3);

    expect(secondGroup.type).toBe(SupportedEntry.Group);
    expect(secondGroup.entries.length).toBe(2);
  });

  it('imports as events if there is no timer type column', () => {
    const testdata = [['Title'], ['no timer type'], ['also no timer type']];

    const importMap = {
      title: 'title',
    };

    const result = parseExcel(testdata, {}, 'testSheet', importMap);
    const firstEvent = result.rundown.entries[result.rundown.order[0]];
    const secondEvent = result.rundown.entries[result.rundown.order[1]];

    expect(result.rundown.order.length).toBe(2);
    expect(firstEvent).toMatchObject({
      type: SupportedEntry.Event,
      timerType: TimerType.CountDown,
    });

    expect(secondEvent).toMatchObject({
      type: SupportedEntry.Event,
      timerType: TimerType.CountDown,
    });
  });

  it('imports as events if timer type is empty or has whitespace', () => {
    const testdata = [
      ['Title', 'Timer type'],
      ['first', ' '],
      ['second', undefined],
      ['third', ' count-up '],
    ];

    const importMap = {
      title: 'title',
      timerType: 'timer type',
    };
    const result = parseExcel(testdata, {}, 'testSheet', importMap);
    const firstEvent = result.rundown.entries[result.rundown.order[0]];
    const secondEvent = result.rundown.entries[result.rundown.order[1]];
    const thirdEvent = result.rundown.entries[result.rundown.order[2]];
    expect(result.rundown.order.length).toBe(3);
    expect(firstEvent).toMatchObject({ title: 'first', type: SupportedEntry.Event, timerType: TimerType.CountDown });
    expect(secondEvent).toMatchObject({ title: 'second', type: SupportedEntry.Event, timerType: TimerType.CountDown });
    expect(thirdEvent).toMatchObject({ title: 'third', type: SupportedEntry.Event, timerType: TimerType.CountUp });
  });

  it('am/pm conversion to 24h', () => {
    const testData = [
      ['Time Start', 'Time End', 'ID'],
      ['4:30:00', '4:36:00', 'event-1'],
      ['9:45:00', '10:56:00', 'event-2'],
      ['16:30:00', '16:36:00', 'event-3'],
      ['21:45:00', '22:56:00', 'event-4'],
      ['4:30:00AM', '4:36:00AM', 'event-5'],
      ['9:45:00AM', '10:56:00AM', 'event-6'],
      ['4:30:00PM', '4:36:00PM', 'event-7'],
      ['9:45:00PM', '10:56:00PM', 'event-8'],
    ];

    const importMap = {
      timeStart: 'time start',
      timeEnd: 'time end',
      id: 'id',
    };
    const result = parseExcel(testData, {}, 'testSheet', importMap);
    expect(result.rundown.order.length).toBe(8);
    expect(result.rundown.entries['event-1']).toMatchObject({
      timeStart: 16200000,
      timeEnd: 16560000,
    });
    expect(result.rundown.entries['event-2']).toMatchObject({
      timeStart: 35100000,
      timeEnd: 39360000,
    });
    expect(result.rundown.entries['event-3']).toMatchObject({
      timeStart: 59400000,
      timeEnd: 59760000,
    });
    expect(result.rundown.entries['event-4']).toMatchObject({
      timeStart: 78300000,
      timeEnd: 82560000,
    });
    expect(result.rundown.entries['event-5']).toMatchObject({
      timeStart: 16200000,
      timeEnd: 16560000,
    });
    expect(result.rundown.entries['event-6']).toMatchObject({
      timeStart: 35100000,
      timeEnd: 39360000,
    });
    expect(result.rundown.entries['event-7']).toMatchObject({
      timeStart: 59400000,
      timeEnd: 59760000,
    });
    expect(result.rundown.entries['event-8']).toMatchObject({
      timeStart: 78300000,
      timeEnd: 82560000,
    });
  });

  it('handle leading and trailing whitespace', () => {
    const testData = [
      ['        ID', '    title    ', 'Colour         '], // <--- leading and trailing white space
      ['event-a', 'title', '#F00'],
    ];

    const importMap = {
      id: 'id',
      title: '        title', // <--- leading white space
      colour: 'colour       ', // <--- trailing white space
    };

    const result = parseExcel(testData, {}, 'testSheet', importMap);
    expect(result.rundown.order.length).toBe(1);
    expect(result.rundown.entries['event-a']).toMatchObject({
      colour: '#F00',
      id: 'event-a',
      title: 'title',
    });
  });

  it('parses link start', () => {
    const testData = [
      ['Time Start', 'Time End', 'ID', 'Link Start', 'Timer type'],
      ['4:30:00', '9:45:00', 'A', '', 'count-down'],
      ['9:45:00', '10:56:00', 'B', 'x', 'count-down'],
      ['10:00:00', '16:36:00', 'C', 'x', 'count-down'],
      ['21:45:00', '22:56:00', 'D', '', 'count-down'],
      ['', '', 'GROUP', 'x', 'group'], // <-- group with link
      ['00:0:00', '23:56:00', 'E', 'x', 'count-down'], // <-- must link past previous group
    ];

    const importMap = {
      timeStart: 'time start',
      timeEnd: 'time end',
      linkStart: 'link start',
      id: 'id',
      timerType: 'timer type',
    };

    const result = parseExcel(testData, {}, 'testSheet', importMap);
    expect(result.rundown.order.length).toBe(5);
    expect(result.rundown.order).toMatchObject(['A', 'B', 'C', 'D', 'GROUP']);
    expect(result.rundown.flatOrder.length).toBe(6);
    expect(result.rundown.flatOrder).toMatchObject(['A', 'B', 'C', 'D', 'GROUP', 'E']);

    expect(result.rundown.entries).toMatchObject({
      A: {
        linkStart: false,
      },
      B: {
        linkStart: true,
      },
      C: {
        linkStart: true,
      },
      D: {
        linkStart: false,
      },
      GROUP: {
        type: SupportedEntry.Group,
      },
      E: {
        linkStart: true,
      },
    });
  });

  it('#971 BUG: parses time fields and booleans', () => {
    const testData = [
      [
        'ID',
        'Time Start',
        'Time End',
        'Duration',
        'Link Start',
        'Timer Type',
        'End Action',
        'Warning time',
        'Danger time',
      ],
      [
        'SETUP',
        '1899-12-30T07:15:00.000Z',
        '1899-12-30T08:30:00.000Z',
        '',
        'false',
        'count-down',
        'none',
        '15',
        '00:05:00',
      ],
      [
        'MEET1',
        '1899-12-30T08:30:00.000Z',
        '1899-12-30T10:00:00.000Z',
        '',
        'false',
        'count-down',
        'none',
        15,
        '00:05:00',
      ],
      ['MEET2', '1899-12-30T10:00:00.000Z', '', '60', 'false', 'count-down', 'none', '13', '5'],
      ['lunch', '', '1899-12-30T11:30:00.000Z', '', 'true', 'count-down', 'none', 13, 5],
      ['MEET3', '1899-12-30T11:30:00.000Z', '', 90, false, 'count-up', 'none', '11', 5],
      ['MEET4', '', '', 30, true, 'count-up', 'none', 11, '00:05:00'],
    ];

    const parsedData = parseExcel(testData, {}, 'bug-report');

    // '15' as a string is parsed by smart time entry as minutes
    expect(parsedData.rundown.entries['SETUP']).toMatchObject({
      timeWarning: 15 * MILLIS_PER_MINUTE,
    });

    // elements in bug report
    // 15 is a number, in which case we parse it as a minutes value
    expect(parsedData.rundown.entries['MEET1']).toMatchObject({
      timeWarning: 15 * MILLIS_PER_MINUTE,
    });

    // in the case where a string is passed, we need to check whether it is an ISO 8601 date
    expect(parsedData.rundown.entries['MEET2']).toMatchObject({
      duration: 60 * MILLIS_PER_MINUTE,
      timeDanger: 5 * MILLIS_PER_MINUTE,
    });

    expect(parsedData.rundown.entries['lunch']).toMatchObject({
      timeWarning: 13 * MILLIS_PER_MINUTE,
      timeDanger: 5 * MILLIS_PER_MINUTE,
    });

    expect(parsedData.rundown.entries['MEET3']).toMatchObject({
      duration: 90 * MILLIS_PER_MINUTE,
      linkStart: false,
      timeWarning: 11 * MILLIS_PER_MINUTE,
      timeDanger: 5 * MILLIS_PER_MINUTE,
    });

    expect(parsedData.rundown.entries['MEET4']).toMatchObject({
      duration: 30 * MILLIS_PER_MINUTE,
      timeWarning: 11 * MILLIS_PER_MINUTE,
      linkStart: true,
    });
  });

  it('handles milestones', () => {
    const testdata = [
      ['Title', 'type', 'notes'],
      ['event...', 'count-down', ''],
      ['also event...', 'count-down', ''],
      ['this i a milestone', 'milestone', 'milestone note'],
    ];

    const importMap = {
      title: 'title',
      timerType: 'type',
      note: 'notes',
    } as ImportMap;

    const result = parseExcel(testdata, {}, 'testSheet', importMap);
    const firstEvent = result.rundown.entries[result.rundown.order[0]];
    const secondEvent = result.rundown.entries[result.rundown.order[1]];
    const milestone = result.rundown.entries[result.rundown.order[2]];

    expect(result.rundown.order.length).toBe(3);
    expect(firstEvent).toMatchObject({
      type: SupportedEntry.Event,
      timerType: TimerType.CountDown,
    });

    expect(secondEvent).toMatchObject({
      type: SupportedEntry.Event,
      timerType: TimerType.CountDown,
    });

    expect(milestone).toMatchObject({
      type: SupportedEntry.Milestone,
      title: 'this i a milestone',
      note: 'milestone note',
    });
  });
});

describe('getCustomFieldData()', () => {
  it('generates a list of keys from the given import map', () => {
    const importMap = {
      worksheet: 'event schedule',
      timeStart: 'time start',
      linkStart: 'link start',
      timeEnd: 'time end',
      duration: 'duration',
      flag: 'flag',
      cue: 'cue',
      title: 'title',
      countToEnd: 'count to end',
      skip: 'skip',
      note: 'notes',
      colour: 'colour',
      endAction: 'end action',
      timerType: 'timer type',
      timeWarning: 'warning time',
      timeDanger: 'danger time',
      custom: {
        lighting: 'lx',
        sound: 'sound',
        video: 'av',
      },
      entryId: 'id',
    } as ImportMap;

    const result = getCustomFieldData(importMap, {});
    expect(result.mergedCustomFields).toStrictEqual({
      lighting: {
        type: 'text',
        colour: '',
        label: 'lighting',
      },
      sound: {
        type: 'text',
        colour: '',
        label: 'sound',
      },
      video: {
        type: 'text',
        colour: '',
        label: 'video',
      },
    });

    // it is an inverted record of <importKey, ontimeKey>
    expect(result.customFieldImportKeys).toStrictEqual({
      lx: 'lighting',
      sound: 'sound',
      av: 'video',
    });
  });

  it('keeps colour information from existing fields', () => {
    const importMap = {
      worksheet: 'event schedule',
      timeStart: 'time start',
      linkStart: 'link start',
      timeEnd: 'time end',
      duration: 'duration',
      flag: 'flag',
      cue: 'cue',
      title: 'title',
      countToEnd: 'count to end',
      skip: 'skip',
      note: 'notes',
      colour: 'colour',
      endAction: 'end action',
      timerType: 'timer type',
      timeWarning: 'warning time',
      timeDanger: 'danger time',
      custom: {
        lighting: 'lx',
        sound: 'sound',
        video: 'av',
        'ontime key': 'excel label',
      },
      entryId: 'id',
    } as ImportMap;

    const existingCustomFields: CustomFields = {
      lighting: { label: 'lighting', type: 'text', colour: 'red' },
      sound: { label: 'sound', type: 'text', colour: 'green' },
      ontime_key: { label: 'ontime key', type: 'text', colour: 'blue' },
    };

    const result = getCustomFieldData(importMap, existingCustomFields);
    expect(result.mergedCustomFields).toStrictEqual({
      lighting: {
        type: 'text',
        colour: 'red',
        label: 'lighting',
      },
      sound: {
        type: 'text',
        colour: 'green',
        label: 'sound',
      },
      video: {
        type: 'text',
        colour: '',
        label: 'video',
      },
      ontime_key: {
        type: 'text',
        colour: 'blue',
        label: 'ontime key',
      },
    });

    // it is an inverted record of <importKey, ontimeKey>
    expect(result.customFieldImportKeys).toStrictEqual({
      lx: 'lighting',
      sound: 'sound',
      av: 'video',
      'excel label': 'ontime_key',
    });
  });

  it('lowercases the keys in the import map', () => {
    const importMap: ImportMap = {
      ...defaultImportMap,
      custom: {
        Lighting: 'Lx',
        Sound: 'sound',
        video: 'av',
      },
    };

    const result = getCustomFieldData(importMap, {});
    expect(result.mergedCustomFields).toStrictEqual({
      Lighting: {
        type: 'text',
        colour: '',
        label: 'Lighting',
      },
      Sound: {
        type: 'text',
        colour: '',
        label: 'Sound',
      },
      video: {
        type: 'text',
        colour: '',
        label: 'video',
      },
    });

    // notice that the keys excel keys are lowercased
    expect(result.customFieldImportKeys).toStrictEqual({
      lx: 'Lighting',
      sound: 'Sound',
      av: 'video',
    });
  });
});
