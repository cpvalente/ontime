import jest from 'jest-mock';
import { dbModelv1, dbModelv1 as dbModel } from '../../models/dataModel.js';
import { isStringEmpty, parseExcel_v1, parseJson_v1, validateEvent_v1 } from '../parser.js';
import { makeString, validateDuration } from '../parserUtils.js';
import { parseAliases_v1, parseUserFields_v1 } from '../parserUtils_v1.js';

describe('test json parser with valid def', () => {
  const testData = {
    events: [
      {
        title: 'Guest Welcoming',
        subtitle: '',
        presenter: '',
        note: '',
        timeStart: 31500000,
        timeEnd: 32400000,
        timeType: 'start-end',
        duration: 32400000 - 31500000,
        isPublic: false,
        colour: '',
        type: 'event',
        revision: 0,
        id: '4b31',
        user0: '',
        user1: '',
        user2: '',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
      },
      {
        title: 'Good Morning',
        subtitle: 'Days schedule',
        presenter: 'Carlos Valente',
        note: '',
        timeStart: 32400000,
        timeEnd: 36000000,
        timeType: 'start-end',
        duration: 36000000 - 32400000,
        isPublic: true,
        skip: true,
        colour: 'red',
        type: 'event',
        revision: 0,
        id: 'f24d',
        user0: '',
        user1: '',
        user2: '',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
      },
      {
        title: 'Stage 2 setup',
        subtitle: '',
        presenter: '',
        note: '',
        timeStart: 32400000,
        timeEnd: 37200000,
        timeType: 'start-end',
        duration: 37200000 - 32400000,
        isPublic: false,
        colour: '',
        type: 'event',
        revision: 0,
        id: 'bbc5',
        user0: '',
        user1: '',
        user2: '',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
      },
      {
        title: 'Working Procedures',
        subtitle: '',
        presenter: 'Filip Johansen',
        note: '',
        timeStart: 37200000,
        timeEnd: 39000000,
        timeType: 'start-end',
        duration: 39000000 - 37200000,
        isPublic: true,
        skip: false,
        colour: '',
        type: 'event',
        revision: 0,
        id: '5b3e',
      },
      {
        title: 'Lunch',
        subtitle: '',
        presenter: '',
        note: '',
        timeStart: 39600000,
        timeEnd: 45000000,
        timeType: 'start-end',
        duration: 37200000 - 32400000,
        isPublic: false,
        colour: '',
        type: 'event',
        revision: 0,
        id: '8e2c',
        user0: '',
        user1: '',
        user2: '',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
      },
      {
        title: 'A day being carlos',
        subtitle: 'My life in a song',
        presenter: 'Carlos Valente',
        note: '',
        timeStart: 46800000,
        timeEnd: 50400000,
        timeType: 'start-end',
        duration: 37200000 - 32400000,
        isPublic: true,
        colour: '',
        type: 'event',
        revision: 0,
        id: '08e9',
        user0: '',
        user1: '',
        user2: '',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
      },
      {
        title: 'Hamburgers and Cheese',
        subtitle: '... and other life questions',
        presenter: 'Filip Johansen',
        note: '',
        timeStart: 54000000,
        timeEnd: 57600000,
        timeType: 'start-end',
        duration: 37200000 - 32400000,
        isPublic: true,
        colour: '',
        type: 'event',
        revision: 0,
        id: 'e25a',
        user0: '',
        user1: '',
        user2: '',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
      },
    ],
    event: {
      title: 'This is a test definition',
      url: 'www.carlosvalente.com',
      publicInfo: 'WiFi: demoproject \nPassword: ontimeproject',
      backstageInfo: 'WiFi: demobackstage\nPassword: ontimeproject',
    },
    settings: {
      app: 'ontime',
      version: 1,
    },
  };

  let parseResponse;

  beforeEach(async () => {
    parseResponse = await parseJson_v1(testData);
  });

  it('has 7 events', () => {
    const length = parseResponse?.events.length;
    expect(length).toBe(7);
  });

  it('first event is as a match', () => {
    const first = parseResponse?.events[0];
    const expected = {
      title: 'Guest Welcoming',
      subtitle: '',
      presenter: '',
      note: '',
      timeStart: 31500000,
      timeEnd: 32400000,
      timeType: 'start-end',
      duration: 32400000 - 31500000,
      isPublic: false,
      skip: false,
      colour: '',
      type: 'event',
      revision: 0,
      id: '4b31',
      user0: '',
      user1: '',
      user2: '',
      user3: '',
      user4: '',
      user5: '',
      user6: '',
      user7: '',
      user8: '',
      user9: '',
    };
    expect(first).toStrictEqual(expected);
  });

  it('second event is as a match', () => {
    const second = parseResponse?.events[1];
    const expected = {
      title: 'Good Morning',
      subtitle: 'Days schedule',
      presenter: 'Carlos Valente',
      note: '',
      timeStart: 32400000,
      timeEnd: 36000000,
      timeType: 'start-end',
      duration: 36000000 - 32400000,
      isPublic: true,
      skip: true,
      colour: 'red',
      type: 'event',
      revision: 0,
      id: 'f24d',
      user0: '',
      user1: '',
      user2: '',
      user3: '',
      user4: '',
      user5: '',
      user6: '',
      user7: '',
      user8: '',
      user9: '',
    };
    expect(second).toStrictEqual(expected);
  });

  it('loaded event settings', () => {
    const eventTitle = parseResponse?.event?.title;
    expect(eventTitle).toBe('This is a test definition');
  });

  it('endMessage to exist but be empty', () => {
    const endMessage = parseResponse?.event?.endMessage;
    expect(endMessage).toBeDefined();
    expect(endMessage).toBe('');
  });

  it('settings are for right app and version', () => {
    const settings = parseResponse?.settings;
    expect(settings.app).toBe('ontime');
    expect(settings.version).toBe(1);
  });

  it('missing settings', () => {
    const settings = parseResponse?.settings;
    expect(settings.osc_port).toBeUndefined();
  });
});

describe('test parser edge cases', () => {
  it('generates missing ids', async () => {
    const testData = {
      events: [
        {
          title: 'Test Event',
          type: 'event',
        },
      ],
    };

    const parseResponse = await parseJson_v1(testData);
    expect(parseResponse.events[0].id).toBeDefined();
  });

  it('detects duplicate Ids', async () => {
    console.log = jest.fn();
    const testData = {
      events: [
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

    const parseResponse = await parseJson_v1(testData);
    expect(console.log).toHaveBeenCalledWith('ERROR: ID collision on import, skipping');
    expect(parseResponse?.events.length).toBe(1);
  });

  it('handles incomplete datasets', async () => {
    console.log = jest.fn();
    const testData = {
      events: [
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

    const parseResponse = await parseJson_v1(testData);
    expect(console.log).toHaveBeenCalledWith('ERROR: undefined event type, skipping');
    expect(parseResponse?.events.length).toBe(0);
  });

  it('skips unknown app and version settings', async () => {
    console.log = jest.fn();
    const testData = {
      settings: {
        osc_port: 8888,
      },
    };

    await parseJson_v1(testData);
    expect(console.log).toHaveBeenCalledWith('ERROR: unknown app version, skipping');
  });
});

describe('test corrupt data', () => {
  it('handles some empty events', async () => {
    const emptyEvents = {
      events: [
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
      event: {
        title: 'All about Carlos demo event',
        url: 'www.carlosvalente.com',
        publicInfo: 'WiFi: demoproject \nPassword: ontimeproject',
        backstageInfo: 'WiFi: demobackstage\nPassword: ontimeproject',
        endMessage: '',
      },
      settings: {
        app: 'ontime',
        version: 1,
        serverPort: 4001,
        lock: null,
      },
    };

    const parsedDef = await parseJson_v1(emptyEvents);
    expect(parsedDef.events.length).toBe(2);
  });

  it('handles all empty events', async () => {
    const emptyEvents = {
      events: [{}, {}, {}, {}, {}, {}, {}, {}],
      event: {
        title: 'All about Carlos demo event',
        url: 'www.carlosvalente.com',
        publicInfo: 'WiFi: demoproject \nPassword: ontimeproject',
        backstageInfo: 'WiFi: demobackstage\nPassword: ontimeproject',
        endMessage: '',
      },
      settings: {
        app: 'ontime',
        version: 1,
        serverPort: 4001,
        lock: null,
      },
    };

    const parsedDef = await parseJson_v1(emptyEvents);
    expect(parsedDef.events.length).toBe(0);
  });

  it('handles missing event data', async () => {
    const emptyEventData = {
      events: [{}, {}, {}, {}, {}, {}, {}, {}],
      event: {},
      settings: {
        app: 'ontime',
        version: 1,
        serverPort: 4001,
        lock: null,
      },
    };

    const parsedDef = await parseJson_v1(emptyEventData);
    expect(parsedDef.event).toStrictEqual(dbModel.event);
  });

  it('handles missing settings', async () => {
    const missingSettings = {
      events: [{}, {}, {}, {}, {}, {}, {}, {}],
      event: {},
      settings: {
        app: 'ontime',
        version: 1,
      },
    };

    const parsedDef = await parseJson_v1(missingSettings);
    expect(parsedDef.settings).toStrictEqual(dbModel.settings);
  });

  it('fails with invalid JSON', async () => {
    console.log = jest.fn();
    const invalidJSON = 'some random dataset';
    const parsedDef = await parseJson_v1(invalidJSON);
    expect(console.log).toHaveBeenCalledWith('ERROR: Invalid JSON format');
    expect(parsedDef).toBe(-1);
  });
});

describe('test event validator', () => {
  it('validates a good object', () => {
    const event = {
      title: 'test',
    };
    const validated = validateEvent_v1(event);

    expect(validated).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        subtitle: expect.any(String),
        presenter: expect.any(String),
        note: expect.any(String),
        timeStart: expect.any(Number),
        timeEnd: expect.any(Number),
        isPublic: expect.any(Boolean),
        skip: expect.any(Boolean),
        revision: expect.any(Number),
        type: expect.any(String),
        id: expect.any(String),
        colour: expect.any(String),
        user0: expect.any(String),
        user1: expect.any(String),
        user2: expect.any(String),
        user3: expect.any(String),
        user4: expect.any(String),
        user5: expect.any(String),
        user6: expect.any(String),
        user7: expect.any(String),
        user8: expect.any(String),
        user9: expect.any(String),
      })
    );
  });

  it('fails an empty object', () => {
    const event = {};
    const validated = validateEvent_v1(event);
    expect(validated).toEqual(null);
  });

  it('makes objects strings', () => {
    const event = {
      title: 2,
      subtitle: true,
      presenter: 3.2,
      note: '1899-12-30T08:00:10.000Z',
    };
    const validated = validateEvent_v1(event);
    expect(typeof validated.title).toEqual('string');
    expect(typeof validated.subtitle).toEqual('string');
    expect(typeof validated.presenter).toEqual('string');
    expect(typeof validated.note).toEqual('string');
  });

  it('enforces numbers on times', () => {
    const event = {
      timeStart: false,
      timeEnd: '2',
    };
    const validated = validateEvent_v1(event);
    expect(typeof validated.timeStart).toEqual('number');
    expect(validated.timeStart).toEqual(0);
    expect(typeof validated.timeEnd).toEqual('number');
    expect(validated.timeEnd).toEqual(0);
  });

  it('handles bad objects', () => {
    const event = {
      title: {},
    };
    const validated = validateEvent_v1(event);
    expect(typeof validated.title).toEqual('string');
  });
});

describe('test makeString function', () => {
  it('converts variables to string', () => {
    let val = 2;
    let expected = '2';
    let converted = makeString(val);
    expect(converted).toBe(expected);

    val = 2.22222222;
    expected = '2.22222222';
    converted = makeString(val);
    expect(converted).toBe(expected);

    val = ['testing'];
    expected = 'testing';
    converted = makeString(val);
    expect(converted).toBe(expected);

    val = { doing: 'testing' };
    converted = makeString(val, 'fallback');
    expect(converted).toBe('fallback');
  });
});

describe('test parseExcel function', () => {
  it('parses the example file', async () => {
    const testdata = [
      ['Ontime ┬À Schedule Template'],
      [],
      ['Event Name', 'Test Event'],
      ['Event URL', 'www.carlosvalente.com'],
      [],
      [],
      [
        'Time Start',
        'Time End',
        'Event Title',
        'Presenter Name',
        'Event Subtitle',
        'Is Public? (x)',
        'Skip? (x)',
        'Notes',
        'User0:test0',
        'User1:test1',
        'User2:test2',
        'User3:test3',
        'User4:test4',
        'User5:test5',
        'User6:test6',
        'user7:test7',
        'user8:test8',
        'user9:test9',
        'Colour',
      ],
      [
        '1899-12-30T07:00:00.000Z',
        '1899-12-30T08:00:10.000Z',
        'Guest Welcome',
        'Carlos',
        'Getting things started',
        'x',
        '',
        'Ballyhoo',
        '',
        '',
        '',
        '',
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
      ],
      [
        '1899-12-30T08:00:00.000Z',
        '1899-12-30T08:30:00.000Z',
        'A song from the hearth',
        'Still Carlos',
        'Derailing early',
        '',
        '',
        'Rainbow chase',
        '',
        '',
        '',
        '',
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
      ],
      [],
    ];

    const expectedParsedEvents = [
      {
        timeStart: 25200000,
        timeEnd: 28810000,
        title: 'Guest Welcome',
        presenter: 'Carlos',
        subtitle: 'Getting things started',
        isPublic: true,
        skip: false,
        note: 'Ballyhoo',
        user0: 'a0',
        user1: 'a1',
        user2: 'a2',
        user3: 'a3',
        user4: 'a4',
        user5: 'a5',
        user6: 'a6',
        user7: 'a7',
        user8: 'a8',
        user9: 'a9',
        colour: 'red',
        type: 'event',
      },
      {
        timeStart: 28800000,
        timeEnd: 30600000,
        title: 'A song from the hearth',
        presenter: 'Still Carlos',
        subtitle: 'Derailing early',
        isPublic: false,
        skip: true,
        note: 'Rainbow chase',
        user0: 'b0',
        user5: 'b5',
        colour: '#F00',
        type: 'event',
      },
    ];

    const parsedData = await parseExcel_v1(testdata);

    expect(parsedData.events).toBeDefined();
    expect(parsedData.events.title).toBe(expectedParsedEvents.title);
    expect(parsedData.events.presenter).toBe(expectedParsedEvents.presenter);
    expect(parsedData.events.subtitle).toBe(expectedParsedEvents.subtitle);
    expect(parsedData.events.isPublic).toBe(expectedParsedEvents.isPublic);
    expect(parsedData.events.skip).toBe(expectedParsedEvents.skip);
    expect(parsedData.events.note).toBe(expectedParsedEvents.note);
    expect(parsedData.events.type).toBe(expectedParsedEvents.type);
  });
});

describe('test aliases import', () => {
  it('imports a well defined alias', () => {
    const testData = {
      events: [],
      settings: {
        app: 'ontime',
        version: 1,
      },
      aliases: [
        {
          enabled: false,
          alias: 'testalias',
          pathAndParams: 'testpathAndParams',
        },
      ],
    };

    const parsed = parseAliases_v1(testData);
    expect(parsed.length).toBe(1);

    // generates missing id
    expect(parsed[0].id).toBeDefined();
  });
});

describe('test userFields import', () => {
  const model = dbModelv1.userFields;
  it('imports a fully defined user fields', () => {
    const testUserFields = {
      user0: 'test0',
      user1: 'test1',
      user2: 'test2',
      user3: 'test3',
      user4: 'test4',
      user5: 'test5',
      user6: 'test6',
      user7: 'test7',
      user8: 'test8',
      user9: 'test9',
    };

    const testData = {
      events: [],
      settings: {
        app: 'ontime',
        version: 1,
      },
      userFields: testUserFields,
    };

    const parsed = parseUserFields_v1(testData);
    expect(parsed).toStrictEqual(testUserFields);
  });

  it('imports a partially defined user fields', () => {
    const testUserFields = {
      user0: 'test0',
      user1: 'test1',
      user7: 'test7',
      user8: 'test8',
      user9: 'test9',
    };

    const expected = {
      ...model,
      ...testUserFields,
    };

    const testData = {
      events: [],
      settings: {
        app: 'ontime',
        version: 1,
      },
      userFields: testUserFields,
    };

    const parsed = parseUserFields_v1(testData);
    expect(parsed).toStrictEqual(expected);
  });

  it('handles missing user fields', () => {
    const testData = {
      events: [],
      settings: {
        app: 'ontime',
        version: 1,
      },
    };

    const parsed = parseUserFields_v1(testData);
    expect(parsed).toStrictEqual(model);
    expect(parsed).toStrictEqual(model);
  });

  it('ignores badly defined fields', () => {
    const testData = {
      events: [],
      settings: {
        app: 'ontime',
        version: 1,
      },
      userFields: {
        notThis: 'this shouldng be accepted',
        orThis: 'this neither',
      },
    };

    const parsed = parseUserFields_v1(testData);
    expect(parsed).toStrictEqual(model);
  });
});

describe('test validateDuration()', () => {
  describe('handles valid inputs', () => {
    const valid = [
      { test: 'zero values', timeStart: 0, timeEnd: 0 },
      { test: 'end after start', timeStart: 0, timeEnd: 1 },
    ];

    valid.forEach((t) => {
      it(t.test, () => {
        const d = validateDuration(t.timeStart, t.timeEnd);
        expect(d).toBe(t.timeEnd - t.timeStart);
      });
    });
  });

  describe('handles edge cases', () => {
    // edge cases
    const testData = [
      { test: 'negative 0', timeStart: -0, timeEnd: -0, expected: 0 },
      { test: 'end before start', timeStart: 2, timeEnd: 1, expected: 0 },
    ];

    testData.forEach((t) => {
      it(t.test, () => {
        const d = validateDuration(t.timeStart, t.timeEnd);
        expect(d).toBe(t.expected);
      });
    });
  });
});

describe('isStringEmpty() function', () => {
  describe('returns true with any non empty', () => {
    const notEmpty = ['test', 'thisalso', '123', '#'];
    for (const testValue of notEmpty) {
      it(testValue, () => {
        const isEmpty = isStringEmpty(testValue);
        expect(isEmpty).toBe(false);
      });
    }
  });
  describe('returns true empty string or undefined', () => {
    const empty = ['', ' ', undefined, null];
    for (const testValue of empty) {
      it(`handles ${testValue}`, () => {
        const isEmpty = isStringEmpty(testValue);
        expect(isEmpty).toBe(true);
      });
    }
  });
});
