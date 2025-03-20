/* eslint-disable no-console -- we are mocking the console */
import { assertType, vi } from 'vitest';

import { CustomFields, DatabaseModel, OntimeEvent, SupportedEvent, TimerType } from 'ontime-types';
import { ImportMap, MILLIS_PER_MINUTE } from 'ontime-utils';

import { dbModel } from '../../models/dataModel.js';
import { demoDb } from '../../models/demoProject.js';

import { createEvent, getCustomFieldData, parseExcel, parseDatabaseModel } from '../parser.js';
import { makeString } from '../parserUtils.js';
import { parseUrlPresets, parseViewSettings } from '../parserFunctions.js';

import { dataFromExcelTemplate } from './parser.mock-data.js';

// mock data provider
beforeAll(() => {
  vi.mock('../../classes/data-provider/DataProvider.js', () => {
    return {
      getDataProvider: vi.fn().mockImplementation(() => {
        return {
          setRundown: vi.fn().mockImplementation((newData) => newData),
          setCustomFields: vi.fn().mockImplementation((newData) => newData),
        };
      }),
    };
  });
});

describe('test parseDatabaseModel() with demo project (valid)', () => {
  const filteredDemoProject = structuredClone(demoDb);
  const { data } = parseDatabaseModel(filteredDemoProject);

  delete filteredDemoProject.settings.version;
  delete data.settings.version;

  it('has 16 events', () => {
    expect(data.rundowns.demo.order.length).toBe(16);
    expect(Object.keys(data.rundowns.demo.entries).length).toBe(16);
  });

  it('is the same as the demo project since all data is valid', () => {
    expect(data).toMatchObject(filteredDemoProject);
  });
});

describe('test parseDatabaseModel() edge cases', () => {
  it('skips unknown app and version settings', () => {
    console.log = vi.fn();
    const testData = {
      settings: {
        osc_port: 8888,
      },
    };

    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    expect(() => parseDatabaseModel(testData)).toThrow();
  });

  it('fails with invalid JSON', () => {
    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    expect(() => parseDatabaseModel('some random dataset')).toThrow();
  });
});

describe('test event validator', () => {
  it('validates a good object', () => {
    const event = {
      title: 'test',
    };
    const validated = createEvent(event, 1);

    expect(validated).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        note: expect.any(String),
        timeStart: expect.any(Number),
        timeEnd: expect.any(Number),
        countToEnd: expect.any(Boolean),
        isPublic: expect.any(Boolean),
        skip: expect.any(Boolean),
        revision: expect.any(Number),
        type: expect.any(String),
        id: expect.any(String),
        cue: '2',
        colour: expect.any(String),
        custom: expect.any(Object),
      }),
    );
  });

  it('fails an empty object', () => {
    const event = {};
    const validated = createEvent(event, 1);
    expect(validated).toEqual(null);
  });

  it('makes objects strings', () => {
    const event = {
      title: 2,
      note: '1899-12-30T08:00:10.000Z',
    };
    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const validated = createEvent(event, 1);
    if (validated === null) {
      throw new Error('unexpected value');
    }
    expect(typeof validated.title).toEqual('string');
    expect(typeof validated.note).toEqual('string');
  });

  it('enforces numbers on times', () => {
    const event = {
      timeStart: false,
      timeEnd: '2',
    };
    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const validated = createEvent(event);
    if (validated === null) {
      throw new Error('unexpected value');
    }
    assertType<number>(validated.timeStart);
    assertType<number>(validated.timeEnd);
    assertType<number>(validated.duration);
    expect(validated.timeStart).toEqual(0);
    expect(validated.timeEnd).toEqual(2);
    expect(validated.duration).toEqual(2);
  });

  it('handles bad objects', () => {
    const event = {
      title: {},
    };
    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const validated = createEvent(event);
    if (validated === null) {
      throw new Error('unexpected value');
    }
    expect(typeof validated.title).toEqual('string');
  });
});

describe('test aliases import', () => {
  it('imports a well defined urlPreset', () => {
    const testData = {
      rundown: [],
      settings: {
        app: 'ontime',
        version: '2.0.0',
      },
      urlPresets: [
        {
          enabled: false,
          alias: 'testalias',
          pathAndParams: 'testpathAndParams',
        },
      ],
    } as unknown as DatabaseModel;

    const parsed = parseUrlPresets(testData);
    expect(parsed.length).toBe(1);

    // generates missing id
    expect(parsed[0].alias).toBeDefined();
  });
});

describe('test views import', () => {
  it('imports data from file', () => {
    const testData = {
      rundown: [],
      settings: {
        app: 'ontime',
        version: '2.0.0',
      },
      viewSettings: {
        normalColor: '#ffffffcc',
        warningColor: '#FFAB33',
        dangerColor: '#ED3333',
        endMessage: '',
        overrideStyles: false,
        // known error: properties do not exist
        notAthing: true,
      },
      // known error: views does not exist
      views: {
        overrideStyles: true,
      },
    };
    const expectedParsedViewSettings = {
      normalColor: '#ffffffcc',
      warningColor: '#FFAB33',
      dangerColor: '#ED3333',
      freezeEnd: false,
      endMessage: '',
      overrideStyles: false,
    };
    // @ts-expect-error -- we know the above is incorrect
    const parsed = parseViewSettings(testData);
    expect(parsed).toStrictEqual(expectedParsedViewSettings);
  });

  it('imports defaults to model', () => {
    const testData = {
      rundown: [],
      settings: {
        app: 'ontime',
        version: '2.0.0',
      },
    } as unknown as DatabaseModel;
    const parsed = parseViewSettings(testData);
    expect(parsed).toStrictEqual(dbModel.viewSettings);
  });
});

describe('makeString()', () => {
  it('converts variables to string', () => {
    const cases = [
      {
        val: 2,
        expected: '2',
      },
      {
        val: 2.22222222,
        expected: '2.22222222',
      },
      {
        val: ['testing'],
        expected: 'testing',
      },
      {
        val: ' testing    ',
        expected: 'testing',
      },
      {
        val: { doing: 'testing' },
        expected: 'fallback',
      },
      {
        val: undefined,
        expected: 'fallback',
      },
    ];

    cases.forEach(({ val, expected }) => {
      const converted = makeString(val, 'fallback');
      expect(converted).toBe(expected);
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
      cue: 'cue',
      title: 'title',
      countToEnd: 'count to end',
      isPublic: 'public',
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
    expect(result.customFields).toStrictEqual({
      lighting: {
        type: 'string',
        colour: '',
        label: 'lighting',
      },
      sound: {
        type: 'string',
        colour: '',
        label: 'sound',
      },
      video: {
        type: 'string',
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
      cue: 'cue',
      title: 'title',
      countToEnd: 'count to end',
      isPublic: 'public',
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

    const customFields: CustomFields = {
      lighting: { label: 'lx', type: 'string', colour: 'red' },
      sound: { label: 'sound', type: 'string', colour: 'green' },
    };

    const result = getCustomFieldData(importMap, customFields);
    expect(result.customFields).toStrictEqual({
      lighting: {
        type: 'string',
        colour: 'red',
        label: 'lighting',
      },
      sound: {
        type: 'string',
        colour: 'green',
        label: 'sound',
      },
      video: {
        type: 'string',
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
});

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
      user0: { type: 'string', colour: 'red', label: 'user0' },
      user1: { type: 'string', colour: 'green', label: 'user1' },
      user2: { type: 'string', colour: 'blue', label: 'user2' },
    };

    const parsedData = parseExcel(dataFromExcelTemplate, existingCustomFields, 'testSheet', importMap);
    expect(parsedData.rundown.title).toBe('testSheet');
    expect(parsedData.customFields).toStrictEqual({
      user0: {
        type: 'string',
        colour: 'red',
        label: 'user0',
      },
      user1: {
        type: 'string',
        colour: 'green',
        label: 'user1',
      },
      user2: {
        type: 'string',
        colour: 'blue',
        label: 'user2',
      },
      user3: {
        type: 'string',
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
        isPublic: true,
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
        isPublic: false,
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
        type: 'string',
        colour: '',
        label: 'niu1',
      },
      niu2: {
        type: 'string',
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
      isPublic: true,
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
      isPublic: false,
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

  it('imports blocks', () => {
    const testdata = [
      ['Title', 'Timer type'],
      ['a block', 'block'],
      ['an event', 'clock'],
    ];

    const importMap = {
      title: 'title',
      timerType: 'timer type',
    };
    const result = parseExcel(testdata, {}, 'testSheet', importMap);
    const firstEvent = result.rundown.entries[result.rundown.order[0]];

    expect(result.rundown.order.length).toBe(2);
    expect((firstEvent as OntimeEvent).type).toBe(SupportedEvent.Block);
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
      type: SupportedEvent.Event,
      timerType: TimerType.CountDown,
    });

    expect(secondEvent).toMatchObject({
      type: SupportedEvent.Event,
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
    expect(firstEvent).toMatchObject({ title: 'first', type: SupportedEvent.Event, timerType: TimerType.CountDown });
    expect(secondEvent).toMatchObject({ title: 'second', type: SupportedEvent.Event, timerType: TimerType.CountDown });
    expect(thirdEvent).toMatchObject({ title: 'third', type: SupportedEvent.Event, timerType: TimerType.CountUp });
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

  it('parses link start and checks that is applicable', () => {
    const testData = [
      ['Time Start', 'Time End', 'ID', 'Link Start', 'Timer type'],
      ['4:30:00', '9:45:00', 'A', '', 'count-down'],
      ['9:45:00', '10:56:00', 'B', 'x', 'count-down'],
      ['10:00:00', '16:36:00', 'C', 'x', 'count-down'],
      ['21:45:00', '22:56:00', 'D', '', 'count-down'],
      ['', '', 'BLOCK', 'x', 'block'], // <-- block with link
      ['00:0:00', '23:56:00', 'E', 'x', 'count-down'], // <-- link past blocks
    ];

    const importMap = {
      timeStart: 'time start',
      timeEnd: 'time end',
      linkStart: 'link start',
      id: 'id',
      timerType: 'timer type',
    };

    const result = parseExcel(testData, {}, 'testSheet', importMap);
    expect(result.rundown.order.length).toBe(6);
    expect(result.rundown.order).toMatchObject(['A', 'B', 'C', 'D', 'BLOCK', 'E']);

    expect(result.rundown.entries).toMatchObject({
      A: {
        linkStart: null,
      },
      B: {
        linkStart: 'true', // <--- this will be populated by the cache generation
      },
      C: {
        linkStart: 'true', // <--- this will be populated by the cache generation
      },
      D: {
        linkStart: null,
      },
      BLOCK: {
        type: SupportedEvent.Block,
      },
      E: {
        linkStart: 'true', // <--- this will be populated by the cache generation
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
      linkStart: null,
      timeWarning: 11 * MILLIS_PER_MINUTE,
      timeDanger: 5 * MILLIS_PER_MINUTE,
    });

    expect(parsedData.rundown.entries['MEET4']).toMatchObject({
      duration: 30 * MILLIS_PER_MINUTE,
      timeWarning: 11 * MILLIS_PER_MINUTE,
      linkStart: 'true', // if we get a boolean, we should just use that
    });
  });
});
