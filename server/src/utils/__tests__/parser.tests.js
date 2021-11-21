import jest from 'jest-mock';
import { parseJsonv1 } from '../parser.js';
import { dbModelv1 as dbModel } from '../../models/dataModel.js';

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
        isPublic: false,
        type: 'event',
        revision: 0,
        id: '4b31',
      },
      {
        title: 'Good Morning',
        subtitle: 'Days schedule',
        presenter: 'Carlos Valente',
        note: '',
        timeStart: 32400000,
        timeEnd: 36000000,
        isPublic: true,
        type: 'event',
        revision: 0,
        id: 'f24d',
      },
      {
        title: 'Stage 2 setup',
        subtitle: '',
        presenter: '',
        note: '',
        timeStart: 32400000,
        timeEnd: 37200000,
        isPublic: false,
        type: 'event',
        revision: 0,
        id: 'bbc5',
      },
      {
        title: 'Working Procedures',
        subtitle: '',
        presenter: 'Filip Johansen',
        note: '',
        timeStart: 37200000,
        timeEnd: 39000000,
        isPublic: true,
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
        isPublic: false,
        type: 'event',
        revision: 0,
        id: '8e2c',
      },
      {
        title: 'A day being carlos',
        subtitle: 'My life in a song',
        presenter: 'Carlos Valente',
        note: '',
        timeStart: 46800000,
        timeEnd: 50400000,
        isPublic: true,
        type: 'event',
        revision: 0,
        id: '08e9',
      },
      {
        title: 'Hamburgers and Cheese',
        subtitle: '... and other life questions',
        presenter: 'Filip Johansen',
        note: '',
        timeStart: 54000000,
        timeEnd: 57600000,
        isPublic: true,
        type: 'event',
        revision: 0,
        id: 'e25a',
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
    parseResponse = await parseJsonv1(testData);
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
      isPublic: false,
      type: 'event',
      revision: 0,
      id: '4b31',
    };
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

    const parseResponse = await parseJsonv1(testData);
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

    const parseResponse = await parseJsonv1(testData);
    expect(console.log).toHaveBeenCalledWith(
      'ERROR: ID colision on import, skipping'
    );
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

    const parseResponse = await parseJsonv1(testData);
    expect(console.log).toHaveBeenCalledWith(
      'ERROR: undefined event type, skipping'
    );

    expect(parseResponse?.events.length).toBe(0);
  });

  it('skips unknown app and version settings', async () => {
    console.log = jest.fn();
    const testData = {
      settings: {
        osc_port: 8888,
      },
    };

    await parseJsonv1(testData);
    expect(console.log).toHaveBeenCalledWith(
      'ERROR: unknown app version, skipping'
    );
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
        oscInPort: 8888,
        oscOutPort: 9999,
        oscOutIP: '127.0.0.1',
        oscEnabled: false,
        lock: false,
      },
    };

    const parsedDef = await parseJsonv1(emptyEvents);
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
        oscInPort: 8888,
        oscOutPort: 9999,
        oscOutIP: '127.0.0.1',
        oscEnabled: false,
        lock: false,
      },
    };

    const parsedDef = await parseJsonv1(emptyEvents);
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
        oscInPort: 8888,
        oscOutPort: 9999,
        oscOutIP: '127.0.0.1',
        oscEnabled: false,
        lock: false,
      },
    };

    const parsedDef = await parseJsonv1(emptyEventData);
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

    const parsedDef = await parseJsonv1(missingSettings);
    expect(parsedDef.settings).toStrictEqual(dbModel.settings);
  });

  it('fails with invalid JSON', async () => {
    console.log = jest.fn();
    const invalidJSON = 'some random dataset';
    const parsedDef = await parseJsonv1(invalidJSON);
    expect(console.log).toHaveBeenCalledWith('ERROR: Invalid JSON format');
    expect(parsedDef).toBe(-1);
  });
});
