/* eslint-disable no-console -- we are mocking the console */
import { assertType, vi } from 'vitest';

import {
  DatabaseModel,
  EndAction,
  OntimeEvent,
  OntimeRundown,
  ProjectData,
  Settings,
  SupportedEvent,
  TimerType,
  TimeStrategy,
  ViewSettings,
} from 'ontime-types';

import { dbModel } from '../../models/dataModel.js';

import { createEvent, getCustomFieldData, parseExcel, parseJson } from '../parser.js';
import { makeString } from '../parserUtils.js';
import { parseRundown, parseUrlPresets, parseViewSettings } from '../parserFunctions.js';
import { ImportMap } from 'ontime-utils';

describe('test json parser with valid def', () => {
  const testData: Partial<DatabaseModel> = {
    rundown: [
      {
        id: '4b31',
        cue: 'Guest Welcoming',
        type: SupportedEvent.Event,
        title: 'Guest Welcoming',
        note: '',
        endAction: EndAction.PlayNext,
        timerType: TimerType.Clock,
        timeStart: 31500000,
        timeEnd: 32400000,
        duration: 32400000 - 31500000,
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: null,
        isPublic: false,
        skip: false,
        colour: '',
        revision: 0,
        timeWarning: 0,
        timeDanger: 0,
        custom: {},
      },
      {
        id: 'f24d',
        cue: 'Good Morning',
        type: SupportedEvent.Event,
        title: 'Good Morning',
        note: '',
        endAction: EndAction.PlayNext,
        timerType: TimerType.CountUp,
        timeStart: 32400000,
        timeEnd: 36000000,
        duration: 36000000 - 32400000,
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: null,
        isPublic: true,
        skip: true,
        colour: 'red',
        revision: 0,
        timeWarning: 0,
        timeDanger: 0,
        custom: {},
      },
      {
        id: 'bbc5',
        cue: 'Stage 2 setup',
        type: SupportedEvent.Event,
        title: 'Stage 2 setup',
        note: '',
        endAction: 'wrong action' as EndAction, // testing
        timerType: TimerType.Clock,
        timeStart: 32400000,
        timeEnd: 37200000,
        duration: 37200000 - 32400000,
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: null,
        isPublic: false,
        skip: false,
        colour: '',
        revision: 0,
        timeWarning: 0,
        timeDanger: 0,
        custom: {},
      },
      {
        // testing incomplete dataset
        id: '5b3e',
        cue: 'Working Procedures',
        type: SupportedEvent.Event,
        title: 'Working Procedures',
        note: '',
        endAction: EndAction.None,
        timerType: TimerType.Clock,
        timeStart: 37200000,
        timeEnd: 39000000,
        duration: 39000000 - 37200000,
        isPublic: true,
        skip: false,
        colour: '',
        revision: 0,
        timeWarning: 0,
        timeDanger: 0,
      } as OntimeEvent,
      {
        id: '8e2c',
        cue: 'Lunch',
        title: 'Lunch',
        type: SupportedEvent.Event,
        note: '',
        endAction: EndAction.None,
        timerType: TimerType.Clock,
        timeStart: 39600000,
        timeEnd: 45000000,
        duration: 37200000 - 32400000,
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: null,
        isPublic: false,
        skip: false,
        colour: '',
        revision: 0,
        timeWarning: 0,
        timeDanger: 0,
        custom: {},
      },
      {
        id: '08e9',
        cue: 'A day being carlos',
        title: 'A day being carlos',
        type: SupportedEvent.Event,
        note: '',
        endAction: EndAction.None,
        timerType: TimerType.Clock,
        timeStart: 46800000,
        timeEnd: 50400000,
        duration: 37200000 - 32400000,
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: null,
        isPublic: true,
        skip: true,
        colour: '',
        revision: 0,
        timeWarning: 0,
        timeDanger: 0,
        custom: {},
      },
      {
        // testing incomplete dataset
        id: 'e25a',
        cue: 'Hamburgers and Cheese',
        title: 'Hamburgers and Cheese',
        type: SupportedEvent.Event,
        note: '',
        endAction: EndAction.None,
        timerType: TimerType.Clock,
        timeStart: 54000000,
        timeEnd: 57600000,
        duration: 37200000 - 32400000,
        isPublic: true,
        colour: '',
        revision: 0,
        timeWarning: 0,
        timeDanger: 0,
      } as OntimeEvent,
    ] as OntimeRundown,
    project: {
      title: 'This is a test definition',
      backstageUrl: 'www.carlosvalente.com',
      publicInfo: 'WiFi: demoproject \nPassword: ontimeproject',
      backstageInfo: 'WiFi: demobackstage\nPassword: ontimeproject',
    } as ProjectData,
    settings: {
      app: 'ontime',
      version: '2.0.0',
      timeFormat: '24',
    } as Settings,
    viewSettings: {} as ViewSettings,
  };

  let parseResponse;

  beforeEach(async () => {
    parseResponse = await parseJson(testData);
  });

  it('has 7 events', () => {
    const length = parseResponse?.rundown.length;
    expect(length).toBe(7);
  });

  it('first event is as a match', () => {
    const first = parseResponse?.rundown[0];
    const expected = {
      title: 'Guest Welcoming',
      type: 'event',
      id: '4b31',
    };
    expect(first).toMatchObject(expected);
  });

  it('second event is as a match', () => {
    const second = parseResponse?.rundown[1];
    const expected = {
      title: 'Good Morning',
      type: 'event',
      id: 'f24d',
    };
    expect(second).toMatchObject(expected);
  });
  it('third event end action is set as the default value', () => {
    const third = parseResponse?.rundown[2];
    expect(third.endAction).toStrictEqual(EndAction.None);
  });
  it('fourth event timer type is set as the default value', () => {
    const fourth = parseResponse?.rundown[3];
    expect(fourth.timerType).toStrictEqual(TimerType.Clock);
  });

  it('loaded event settings', () => {
    const eventTitle = parseResponse?.project?.title;
    expect(eventTitle).toBe('This is a test definition');
  });

  it('endMessage to exist but be empty', () => {
    const endMessage = parseResponse?.viewSettings?.endMessage;
    expect(endMessage).toBeDefined();
    expect(endMessage).toBe('');
  });

  it('settings are for right app and version', () => {
    const settings = parseResponse?.settings;
    expect(settings.app).toBe('ontime');
    expect(settings.version).toEqual(expect.any(String));
  });

  it('missing settings', () => {
    const settings = parseResponse?.settings;
    expect(settings.osc_port).toBeUndefined();
  });
});

describe('test parser edge cases', () => {
  it('stringifies necessary values', async () => {
    const testData = {
      rundown: [
        {
          cue: 101,
          type: 'event',
        },
        {
          cue: 101.1,
          type: 'event',
        },
      ],
    };

    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const parseResponse = await parseJson(testData);
    expect(typeof (parseResponse.rundown[0] as OntimeEvent).cue).toBe('string');
    expect(typeof (parseResponse.rundown[1] as OntimeEvent).cue).toBe('string');
  });

  it('generates missing ids', async () => {
    const testData = {
      rundown: [
        {
          title: 'Test Event',
          type: 'event',
        },
      ],
    };

    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const parseResponse = await parseJson(testData);
    expect(parseResponse.rundown[0].id).toBeDefined();
  });

  it('detects duplicate Ids', async () => {
    console.log = vi.fn();
    const testData = {
      rundown: [
        {
          title: 'Test Event 1',
          type: 'event',
          id: '1',
        },
        {
          title: 'Test Event 2',
          type: 'event',
          id: '1',
        },
      ],
    };

    //@ts-expect-error -- we know this is wrong, testing imports outside domain
    const parseResponse = await parseJson(testData);
    expect(console.log).toHaveBeenCalledWith('ERROR: ID collision on import, skipping');
    expect(parseResponse?.rundown.length).toBe(1);
  });

  it('handles incomplete datasets', async () => {
    console.log = vi.fn();
    const testData = {
      rundown: [
        {
          title: 'Test Event 1',
          id: '1',
        },
        {
          title: 'Test Event 2',
          id: '1',
        },
      ],
    };

    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const parseResponse = await parseJson(testData);
    expect(parseResponse?.rundown.length).toBe(0);
  });

  it('skips unknown app and version settings', async () => {
    console.log = vi.fn();
    const testData = {
      settings: {
        osc_port: 8888,
      },
    };

    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    await parseJson(testData);
    expect(console.log).toHaveBeenCalledWith('ERROR: unable to parse settings, missing app or version');
  });
});

describe('test corrupt data', () => {
  it('handles some empty events', async () => {
    const emptyEvents = {
      rundown: [
        {},
        {},
        {},
        {
          title: 'Test Event 1',
          type: 'event',
          id: '1',
        },
        {
          title: 'Test Event 2',
          type: 'event',
          id: '2',
        },
        {},
        {},
        {},
      ],
      project: {
        title: 'All about Carlos demo event',
        description: 'description',
        publicUrl: 'www.carlosvalente.com',
        backstageUrl: 'www.carlosvalente.com',
        publicInfo: 'WiFi: demoproject \nPassword: ontimeproject',
        backstageInfo: 'WiFi: demobackstage\nPassword: ontimeproject',
        endMessage: '',
      },
      settings: {
        app: 'ontime',
        version: '2.0.0',
        serverPort: 4001,
        timeFormat: '24',
      },
    };

    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const parsedDef = await parseJson(emptyEvents);
    expect(parsedDef.rundown.length).toBe(2);
  });

  it('handles all empty events', async () => {
    const emptyEvents = {
      rundown: [{}, {}, {}, {}, {}, {}, {}, {}],
      project: {
        title: 'All about Carlos demo event',
        description: 'description',
        publicUrl: 'www.carlosvalente.com',
        backstageUrl: 'www.carlosvalente.com',
        publicInfo: 'WiFi: demoproject \nPassword: ontimeproject',
        backstageInfo: 'WiFi: demobackstage\nPassword: ontimeproject',
        endMessage: '',
      },
      settings: {
        app: 'ontime',
        version: '2.0.0',
        serverPort: 4001,
        timeFormat: '24',
      },
    };

    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const parsedDef = await parseJson(emptyEvents);
    expect(parsedDef.rundown.length).toBe(0);
  });

  it('handles missing project data', async () => {
    const emptyProjectData = {
      rundown: [{}, {}, {}, {}, {}, {}, {}, {}],
      project: {},
      settings: {
        app: 'ontime',
        version: '2.0.0',
        serverPort: 4001,
        lock: null,
        timeFormat: '24',
      },
    };

    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const parsedDef = await parseJson(emptyProjectData);
    expect(parsedDef.project).toStrictEqual(dbModel.project);
  });

  it('handles missing settings', async () => {
    const missingSettings = {
      rundown: [{}, {}, {}, {}, {}, {}, {}, {}],
      event: {},
      settings: {
        app: 'ontime',
        version: '2.0.0',
      },
    };

    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const parsedDef = await parseJson(missingSettings);
    expect(parsedDef.settings).toStrictEqual(dbModel.settings);
  });

  it('fails with invalid JSON', async () => {
    const invalidJSON = 'some random dataset';

    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const parsedDef = await parseJson(invalidJSON);
    expect(parsedDef).toBeNull();
  });
});

describe('test event validator', () => {
  it('validates a good object', () => {
    const event = {
      title: 'test',
    };
    const validated = createEvent(event, 'test');

    expect(validated).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        note: expect.any(String),
        timeStart: expect.any(Number),
        timeEnd: expect.any(Number),
        isPublic: expect.any(Boolean),
        skip: expect.any(Boolean),
        revision: expect.any(Number),
        type: expect.any(String),
        id: expect.any(String),
        cue: 'test',
        colour: expect.any(String),
        custom: expect.any(Object),
      }),
    );
  });

  it('fails an empty object', () => {
    const event = {};
    const validated = createEvent(event, 'none');
    expect(validated).toEqual(null);
  });

  it('makes objects strings', () => {
    const event = {
      title: 2,
      note: '1899-12-30T08:00:10.000Z',
    };
    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const validated = createEvent(event, 'not-used');
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
    } as DatabaseModel;

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
    } as DatabaseModel;
    const parsed = parseViewSettings(testData);
    expect(parsed).toStrictEqual(dbModel.viewSettings);
  });
});

describe('test import of v2 datamodel', () => {
  it('ignores deprecated fields and generates new ones', async () => {
    const v2ProjectFile = {
      rundown: [
        { type: SupportedEvent.Block, title: 'block-title', id: 'block-id' },
        { type: SupportedEvent.Delay, duration: 0 },
        { type: SupportedEvent.Event, title: 'event-title', id: 'event-id' },
      ],
      project: {
        title: '',
        description: '',
        publicUrl: '',
        publicInfo: '',
        backstageUrl: '',
        backstageInfo: '',
      },
      settings: {
        app: 'ontime',
        version: '2.0.0',
        serverPort: 4001,
        editorKey: null,
        operatorKey: null,
        timeFormat: '24',
        language: 'en',
      },
      viewSettings: {
        overrideStyles: false,
        normalColor: '#ffffffcc',
        warningColor: '#FFAB33',
        dangerColor: '#ED3333',
        endMessage: '',
      },
      aliases: [],
      userFields: {
        user0: 'user0',
        user1: 'user1',
        user2: 'user2',
        user3: 'user3',
        user4: 'user4',
        user5: 'user5',
        user6: 'user6',
        user7: 'user7',
        user8: 'user8',
        user9: 'user9',
      },
      osc: {
        portIn: 8888,
        portOut: 9999,
        targetIP: '127.0.0.1',
        enabledIn: false,
        enabledOut: false,
        subscriptions: {
          onLoad: [],
          onStart: [],
          onPause: [],
          onStop: [],
          onUpdate: [],
          onFinish: [],
        },
      },
      http: {
        enabledOut: false,
        subscriptions: {
          onLoad: [],
          onStart: [],
          onPause: [],
          onStop: [],
          onUpdate: [],
          onFinish: [],
        },
      },
    };
    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const parsed = await parseJson(v2ProjectFile);
    expect(parsed.rundown.length).toBe(3);
    expect(parsed.rundown[0]).toMatchObject({ type: SupportedEvent.Block });
    expect(parsed.rundown[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
      }),
    );
    expect(parsed.rundown[1]).toMatchObject({ type: SupportedEvent.Delay });
    expect(parsed.rundown[1]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        duration: expect.any(Number),
      }),
    );
    expect(parsed.rundown[2]).toMatchObject({ type: SupportedEvent.Event });
    expect(parsed.rundown[2]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        cue: expect.any(String),
        title: expect.any(String),
        note: expect.any(String),
        endAction: expect.any(String),
        timerType: expect.any(String),
        linkStart: null,
        timeStrategy: expect.any(String),
        timeStart: expect.any(Number),
        timeEnd: expect.any(Number),
        duration: expect.any(Number),
        isPublic: expect.any(Boolean),
        skip: expect.any(Boolean),
        colour: expect.any(String),
        revision: expect.any(Number),
        timeWarning: expect.any(Number),
        timeDanger: expect.any(Number),
        custom: expect.any(Object),
      }),
    );
    // @ts-expect-error -- checking if the field is removed
    expect(parsed?.userFields).toBeUndefined();
    expect(parsed.osc).toMatchObject({ subscriptions: [] });
    expect(parsed.http).toMatchObject({ enabledOut: false, subscriptions: [] });
  });
});

describe('makeString()', () => {
  it('converts variables to string', () => {
    let val = 2;
    let expected = '2';
    let converted = makeString(val);
    expect(converted).toBe(expected);

    val = 2.22222222;
    expected = '2.22222222';
    converted = makeString(val);
    expect(converted).toBe(expected);

    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    val = ['testing'];
    expected = 'testing';
    converted = makeString(val);
    expect(converted).toBe(expected);

    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    val = { doing: 'testing' };
    converted = makeString(val, 'fallback');
    expect(converted).toBe('fallback');
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
    } as ImportMap;

    const result = getCustomFieldData(importMap);
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
});

describe('parseExcel()', () => {
  it('parses the example file', async () => {
    const testdata = [
      ['Ontime ┬À Schedule Template'],
      [],
      [
        'Time Start',
        'Time End',
        'Title',
        'End Action',
        'Timer type',
        'Public',
        'Skip',
        'Notes',
        't0',
        'Test1',
        'test2',
        'test3',
        'test4',
        'test5',
        'test6',
        'test7',
        'test8',
        'test9',
        'Colour',
        'cue',
      ],
      [
        '07:00:00',
        '08:00:10',
        'Guest Welcome',
        '',
        '',
        'x',
        '',
        'Ballyhoo',
        'a0',
        'a1',
        'a2',
        'a3',
        'a4',
        'a5',
        'a6',
        'a7',
        'a8',
        'a9',
        'red',
        101,
      ],
      [
        '08:00:00',
        '08:30:00',
        'A song from the hearth',
        'load-next',
        'clock',
        '',
        'x',
        'Rainbow chase',
        'b0',
        '',
        '',
        '',
        '',
        'b5',
        '',
        '',
        '',
        '',
        '#F00',
        102,
      ],
      [],
    ];

    // partial import map with only custom fields
    const importMap = {
      custom: {
        user0: 't0',
        User1: 'Test1',
        user2: 'test2',
        user3: 'test3',
        user4: 'test4',
        user5: 'test5',
        user6: 'test6',
        user7: 'test7',
        user8: 'test8',
        user9: 'test9',
      },
    };

    // TODO: update tests once import is resolved
    const expectedParsedRundown = [
      {
        timeStart: 25200000,
        timeEnd: 28810000,
        title: 'Guest Welcome',
        timerType: 'count-down',
        endAction: 'none',
        isPublic: true,
        skip: false,
        note: 'Ballyhoo',
        custom: {
          user0: { value: 'a0' },
          user1: { value: 'a1' },
          user2: { value: 'a2' },
          user3: { value: 'a3' },
          user4: { value: 'a4' },
          user5: { value: 'a5' },
          user6: { value: 'a6' },
          user7: { value: 'a7' },
          user8: { value: 'a8' },
          user9: { value: 'a9' },
        },
        colour: 'red',
        type: 'event',
        cue: '101',
      },
      {
        timeStart: 28800000,
        timeEnd: 30600000,
        title: 'A song from the hearth',
        timerType: 'clock',
        endAction: 'load-next',
        isPublic: false,
        skip: true,
        note: 'Rainbow chase',
        custom: {
          user0: { value: 'b0' },
          user5: { value: 'b5' },
        },
        colour: '#F00',
        type: 'event',
        cue: '102',
      },
    ];

    const parsedData = parseExcel(testdata, importMap);
    expect(parsedData.customFields).toStrictEqual({
      user0: {
        type: 'string',
        colour: '',
        label: 'user0',
      },
      user1: {
        type: 'string',
        colour: '',
        label: 'User1',
      },
      user2: {
        type: 'string',
        colour: '',
        label: 'user2',
      },
      user3: {
        type: 'string',
        colour: '',
        label: 'user3',
      },
      user4: {
        type: 'string',
        colour: '',
        label: 'user4',
      },
      user5: {
        type: 'string',
        colour: '',
        label: 'user5',
      },
      user6: {
        type: 'string',
        colour: '',
        label: 'user6',
      },
      user7: {
        type: 'string',
        colour: '',
        label: 'user7',
      },
      user8: {
        type: 'string',
        colour: '',
        label: 'user8',
      },
      user9: {
        type: 'string',
        colour: '',
        label: 'user9',
      },
    });
    expect(parsedData.rundown.length).toBe(2);
    expect(parsedData.rundown[0]).toMatchObject(expectedParsedRundown[0]);
    expect(parsedData.rundown[1]).toMatchObject(expectedParsedRundown[1]);
  });

  it('parses a file without custom fields', async () => {
    const testdata = [
      ['Ontime ┬À Schedule Template'],
      [],
      [
        'Time Start',
        'Time End',
        'Title',
        'End Action',
        'Timer type',
        'Public',
        'Skip',
        'Notes',
        'test0',
        'test1',
        'test2',
        'test3',
        'test4',
        'test5',
        'test6',
        'test7',
        'test8',
        'test9',
        'Colour',
        'cue',
      ],
      [
        '1899-12-30T07:00:00.000Z',
        '1899-12-30T08:00:10.000Z',
        'Guest Welcome',
        '',
        '',
        'x',
        '',
        'Ballyhoo',
        'a0',
        'a1',
        'a2',
        'a3',
        'a4',
        'a5',
        'a6',
        'a7',
        'a8',
        'a9',
        'red',
        101,
      ],
      [
        '1899-12-30T08:00:00.000Z',
        '1899-12-30T08:30:00.000Z',
        'A song from the hearth',
        'load-next',
        'clock',
        '',
        'x',
        'Rainbow chase',
        'b0',
        '',
        '',
        '',
        '',
        'b5',
        '',
        '',
        '',
        '',
        '#F00',
        102,
      ],
      [],
    ];

    // partial import map with only custom fields
    const importMap = {
      custom: {
        niu1: 'niu1',
        niu2: 'niu2',
      },
    };

    // TODO: update tests once import is resolved
    const expectedParsedRundown = [
      {
        //timeStart: 28800000,
        //timeEnd: 32410000,
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
      },
      {
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
    ];

    const parsedData = parseExcel(testdata, importMap);
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
    expect(parsedData.rundown.length).toBe(2);
    expect(parsedData.rundown[0]).toMatchObject(expectedParsedRundown[0]);
    expect(parsedData.rundown[1]).toMatchObject(expectedParsedRundown[1]);
  });

  it('ignores unknown event types', () => {
    const testdata = [
      [
        'Time Start',
        'Time End',
        'Title',
        'End Action',
        'Timer type',
        'Public',
        'Skip',
        'Notes',
        'test0',
        'test1',
        'test2',
        'test3',
        'test4',
        'test5',
        'test6',
        'test7',
        'test8',
        'test9',
        'Colour',
        'cue',
      ],
      [
        '1899-12-30T07:00:00.000Z',
        '1899-12-30T08:00:10.000Z',
        'Guest Welcome',
        '',
        'skip',
        'x',
        '',
        'Ballyhoo',
        'a0',
        'a1',
        'a2',
        'a3',
        'a4',
        'a5',
        'a6',
        'a7',
        'a8',
        'a9',
        'red',
        101,
      ],
      [
        '1899-12-30T08:00:00.000Z',
        '1899-12-30T08:30:00.000Z',
        'A song from the hearth',
        'load-next',
        'clock',
        '',
        'x',
        'Rainbow chase',
        'b0',
        '',
        '',
        '',
        '',
        'b5',
        '',
        '',
        '',
        '',
        '#F00',
        102,
      ],
      [],
    ];

    const importMap = {
      worksheet: 'event schedule',
      timeStart: 'time start',
      timeEnd: 'time end',
      duration: 'duration',
      cue: 'cue',
      title: 'title',
      isPublic: 'public',
      skip: 'skip',
      note: 'notes',
      colour: 'colour',
      endAction: 'end action',
      timerType: 'timer type',
      timeWarning: 'warning time',
      timeDanger: 'danger time',
      custom: {},
    };
    const result = parseExcel(testdata, importMap);
    expect(result.rundown.length).toBe(1);
    expect((result.rundown.at(0) as OntimeEvent).title).toBe('A song from the hearth');
  });
  it('imports blocks', () => {
    const testdata = [
      [
        'Time Start',
        'Time End',
        'Title',
        'End Action',
        'Timer type',
        'Public',
        'Skip',
        'Notes',
        'test0',
        'test1',
        'test2',
        'test3',
        'test4',
        'test5',
        'test6',
        'test7',
        'test8',
        'test9',
        'Colour',
        'cue',
      ],
      [
        '',
        '',
        '',
        '',
        'block',
        'x',
        '',
        'Ballyhoo',
        'a0',
        'a1',
        'a2',
        'a3',
        'a4',
        'a5',
        'a6',
        'a7',
        'a8',
        'a9',
        'red',
        101,
      ],
      [
        '1899-12-30T08:00:00.000Z',
        '1899-12-30T08:30:00.000Z',
        'A song from the hearth',
        'load-next',
        'clock',
        '',
        'x',
        'Rainbow chase',
        'b0',
        '',
        '',
        '',
        '',
        'b5',
        '',
        '',
        '',
        '',
        '#F00',
        102,
      ],
      [],
    ];

    const importMap = {
      worksheet: 'event schedule',
      timeStart: 'time start',
      timeEnd: 'time end',
      duration: 'duration',
      cue: 'cue',
      title: 'title',
      isPublic: 'public',
      skip: 'skip',
      note: 'notes',
      colour: 'colour',
      endAction: 'end action',
      timerType: 'timer type',
      timeWarning: 'warning time',
      timeDanger: 'danger time',
      custom: {},
    };
    const result = parseExcel(testdata, importMap);
    expect(result.rundown.length).toBe(2);
    expect(result.rundown.at(0).type).toBe(SupportedEvent.Block);
  });

  it('imports as events if there is no timer type column', () => {
    const testdata = [
      [
        'Time Start',
        'Time End',
        'Title',
        'End Action',
        'Public',
        'Skip',
        'Notes',
        'test0',
        'test1',
        'test2',
        'test3',
        'test4',
        'test5',
        'test6',
        'test7',
        'test8',
        'test9',
        'Colour',
        'cue',
      ],
      ['', '', '', '', 'x', '', 'Ballyhoo', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'red', 101],
      [
        '1899-12-30T08:00:00.000Z',
        '1899-12-30T08:30:00.000Z',
        'A song from the hearth',
        'load-next',
        '',
        'x',
        'Rainbow chase',
        'b0',
        '',
        '',
        '',
        '',
        'b5',
        '',
        '',
        '',
        '',
        '#F00',
        102,
      ],
      [],
    ];

    const importMap = {
      worksheet: 'event schedule',
      timeStart: 'time start',
      timeEnd: 'time end',
      duration: 'duration',
      cue: 'cue',
      title: 'title',
      isPublic: 'public',
      skip: 'skip',
      note: 'notes',
      colour: 'colour',
      endAction: 'end action',
      timerType: 'timer type',
      timeWarning: 'warning time',
      timeDanger: 'danger time',
      custom: {},
    };
    const result = parseExcel(testdata, importMap);
    expect(result.rundown.length).toBe(2);
    expect(result.rundown.at(0).type).toBe(SupportedEvent.Event);
    expect((result.rundown.at(0) as OntimeEvent).timerType).toBe(TimerType.CountDown);
    expect(result.rundown.at(1).type).toBe(SupportedEvent.Event);
    expect((result.rundown.at(1) as OntimeEvent).timerType).toBe(TimerType.CountDown);
  });

  it('am/pm conversion to 24h', () => {
    const testData = [
      ['Time Start', 'Time End', 'Title', 'End Action', 'Public', 'Skip', 'Notes', 'Colour', 'cue'],
      ['4:30:00', '4:36:00', 'A song from the hearth', 'load-next', 'x', '', 'Rainbow chase', '#F00', 102],
      ['9:45:00', '10:56:00', 'Green grass', 'load-next', 'x', '', 'Rainbow chase', '#0F0', 103],
      ['16:30:00', '16:36:00', 'A song from the hearth', 'load-next', 'x', '', 'Rainbow chase', '#F00', 102],
      ['21:45:00', '22:56:00', 'Green grass', 'load-next', 'x', '', 'Rainbow chase', '#0F0', 103],
      ['4:30:00AM', '4:36:00AM', 'A song from the hearth', 'load-next', 'x', '', 'Rainbow chase', '#F00', 102],
      ['9:45:00AM', '10:56:00AM', 'Green grass', 'load-next', 'x', '', 'Rainbow chase', '#0F0', 103],
      ['4:30:00PM', '4:36:00PM', 'A song from the hearth', 'load-next', 'x', '', 'Rainbow chase', '#F00', 102],
      ['9:45:00PM', '10:56:00PM', 'Green grass', 'load-next', 'x', '', 'Rainbow chase', '#0F0', 103],
      [],
    ];

    const importMap = {
      worksheet: 'event schedule',
      timeStart: 'time start',
      timeEnd: 'time end',
      duration: 'duration',
      cue: 'cue',
      title: 'title',
      isPublic: 'public',
      skip: 'skip',
      note: 'notes',
      colour: 'colour',
      endAction: 'end action',
      timerType: 'timer type',
      timeWarning: 'warning time',
      timeDanger: 'danger time',
      custom: {},
    };
    const result = parseExcel(testData, importMap);
    const rundown = parseRundown(result);
    const events = rundown.filter((e) => e.type === SupportedEvent.Event) as OntimeEvent[];
    expect(events.at(0).timeStart).toEqual(16200000);
    expect(events.at(1).timeStart).toEqual(35100000);
    expect(events.at(2).timeStart).toEqual(59400000);
    expect(events.at(3).timeStart).toEqual(78300000);
    expect(events.at(4).timeStart).toEqual(16200000);
    expect(events.at(5).timeStart).toEqual(35100000);
    expect(events.at(6).timeStart).toEqual(59400000);
    expect(events.at(7).timeStart).toEqual(78300000);
  });

  it('link start', () => {
    const testData = [
      ['Time Start', 'Time End', 'Title', 'End Action', 'Public', 'Skip', 'Notes', 'Colour', 'cue', 'Link Start'],
      ['4:30:00', '9:45:00', 'A', 'load-next', 'x', '', 'Rainbow chase', '#F00', 102],
      ['9:45:00', '10:56:00', 'C', 'load-next', 'x', '', 'Rainbow chase', '#0F0', 103, 'x'],
      ['10:56:00', '16:36:00', 'D', 'load-next', 'x', '', 'Rainbow chase', '#F00', 102, 'x'],
      ['21:45:00', '22:56:00', 'E', 'load-next', 'x', '', 'Rainbow chase', '#0F0', 103],
      [],
    ];

    const importMap = {
      worksheet: 'event schedule',
      timeStart: 'time start',
      linkStart: 'link start',
      timeEnd: 'time end',
      duration: 'duration',
      cue: 'cue',
      title: 'title',
      isPublic: 'public',
      skip: 'skip',
      note: 'notes',
      colour: 'colour',
      endAction: 'end action',
      timerType: 'timer type',
      timeWarning: 'warning time',
      timeDanger: 'danger time',
      custom: {},
    };
    const result = parseExcel(testData, importMap);
    const rundown = parseRundown(result);
    const events = rundown.filter((e) => e.type === SupportedEvent.Event) as OntimeEvent[];
    expect(events.at(0).timeStart).toEqual(16200000);

    expect(events.at(1).timeStart).toEqual(events.at(0).timeEnd);
    expect(events.at(1).linkStart).toEqual(events.at(0).id);

    expect(events.at(2).timeStart).toEqual(events.at(1).timeEnd);
    expect(events.at(2).linkStart).toEqual(events.at(1).id);

    expect(events.at(3).timeStart).toEqual(78300000);
  });
});
