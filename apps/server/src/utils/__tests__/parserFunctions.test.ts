import {
  CustomFields,
  DatabaseModel,
  EndAction,
  HttpSettings,
  HttpSubscription,
  OSCSettings,
  OntimeEvent,
  OntimeRundown,
  OscSubscription,
  Settings,
  SupportedEvent,
  TimeStrategy,
  TimerType,
  URLPreset,
} from 'ontime-types';

import {
  parseCustomFields,
  parseHttp,
  parseOsc,
  parseProject,
  parseRundown,
  parseSettings,
  parseUrlPresets,
  parseViewSettings,
  sanitiseCustomFields,
  sanitiseHttpSubscriptions,
  sanitiseOscSubscriptions,
} from '../parserFunctions.js';

describe('parseRundown()', () => {
  it('returns an empty array if no rundown is given', () => {
    const errorEmitter = vi.fn();
    const result = parseRundown({}, errorEmitter);
    expect(result.rundown).toEqual([]);
    expect(result.customFields).toEqual({});
    expect(errorEmitter).toHaveBeenCalledTimes(2);
  });

  it('parses data, skipping invalid results', () => {
    const errorEmitter = vi.fn();
    const rundown = [
      { id: '1', type: SupportedEvent.Event, title: 'test', skip: false }, // OK
      { id: '1', type: SupportedEvent.Block, title: 'test 2', skip: false }, // duplicate ID
      {}, // no data
      { id: '2', title: 'test 2', skip: false }, // no type
    ] as OntimeRundown;
    const { rundown: parsedRundown } = parseRundown({ rundown, customFields: {} }, errorEmitter);
    expect(parsedRundown.length).toEqual(1);
    expect(parsedRundown.at(0)).toMatchObject({ id: '1', type: SupportedEvent.Event, title: 'test', skip: false });
    expect(errorEmitter).toHaveBeenCalled();
  });
});

describe('parseProject()', () => {
  it('returns an a base model if nothing is given', () => {
    const errorEmitter = vi.fn();
    const result = parseProject({}, errorEmitter);
    expect(result).toBeTypeOf('object');
    expect(errorEmitter).toHaveBeenCalledOnce();
  });
});

describe('parseSettings()', () => {
  it('throws if settings object does not exist', () => {
    expect(() => parseSettings({})).toThrow();
  });

  it('returns an a base model as long as we have the app and version', () => {
    const minimalSettings = { app: 'ontime', version: '1' } as Settings;
    const result = parseSettings({ settings: minimalSettings });
    expect(result).toBeTypeOf('object');
  });
});

describe('parseViewSettings()', () => {
  it('returns an a base model if nothing is given', () => {
    const errorEmitter = vi.fn();
    const result = parseViewSettings({}, errorEmitter);
    expect(result).toBeTypeOf('object');
    expect(errorEmitter).toHaveBeenCalledOnce();
  });
});

describe('parseOsc()', () => {
  it('returns an a base model if nothing is given', () => {
    const errorEmitter = vi.fn();
    const result = parseOsc({}, errorEmitter);
    expect(result).toBeTypeOf('object');
    expect(errorEmitter).toHaveBeenCalledOnce();
  });

  it('parses data, skipping invalid results', () => {
    const errorEmitter = vi.fn();
    const osc = {
      subscriptions: [
        { id: '1', cycle: 'onLoad', address: '/test', payload: 'test', enabled: true }, // OK
        {}, // no data
        { id: '2', cycle: 'onStart', payload: 'test', enabled: true }, // no address
      ],
    } as OSCSettings;
    const result = parseOsc({ osc }, errorEmitter);
    expect(result.subscriptions.length).toEqual(1);
    expect(result.subscriptions.at(0)).toMatchObject({
      id: '1',
      cycle: 'onLoad',
      address: '/test',
      payload: 'test',
      enabled: true,
    });
    expect(errorEmitter).toHaveBeenCalled();
  });
});

describe('parseHttp()', () => {
  it('returns an a base model if nothing is given', () => {
    const errorEmitter = vi.fn();
    const result = parseHttp({}, errorEmitter);
    expect(result).toBeTypeOf('object');
    expect(errorEmitter).toHaveBeenCalledOnce();
  });

  it('parses data, skipping invalid results', () => {
    const errorEmitter = vi.fn();
    const http = {
      subscriptions: [
        { id: '1', cycle: 'onLoad', message: 'http://', enabled: true }, // OK
        {}, // no data
        { id: '2', cycle: 'onStart', enabled: true }, // no message
        { id: '3', cycle: 'onLoad', message: '/test', enabled: true }, // doesnt start with http
      ],
    } as HttpSettings;
    const result = parseHttp({ http }, errorEmitter);
    expect(result.subscriptions.length).toEqual(1);
    expect(result.subscriptions.at(0)).toMatchObject({
      id: '1',
      cycle: 'onLoad',
      message: 'http://',
      enabled: true,
    });
    expect(errorEmitter).toHaveBeenCalled();
  });
});

describe('parseUrlPresets()', () => {
  it('returns an a base model if nothing is given', () => {
    const errorEmitter = vi.fn();
    const result = parseUrlPresets({}, errorEmitter);
    expect(result).toBeTypeOf('object');
    expect(errorEmitter).toHaveBeenCalledOnce();
  });

  it('parses data, skipping invalid results', () => {
    const errorEmitter = vi.fn();
    const urlPresets = [{ enabled: true, alias: 'alias', pathAndParams: 'ss' }] as URLPreset[];
    const result = parseUrlPresets({ urlPresets }, errorEmitter);
    expect(result.length).toEqual(1);
    expect(result.at(0)).toMatchObject({
      enabled: true,
      alias: 'alias',
      pathAndParams: 'ss',
    });
    expect(errorEmitter).not.toHaveBeenCalled();
  });
});

describe('parseCustomFields()', () => {
  it('returns an a base model if nothing is given', () => {
    const errorEmitter = vi.fn();
    const result = parseCustomFields({}, errorEmitter);
    expect(result).toBeTypeOf('object');
    expect(errorEmitter).toHaveBeenCalledOnce();
  });

  it('parses data, skipping invalid results', () => {
    const errorEmitter = vi.fn();
    // @ts-expect-error -- data is external, we check bad types
    const customFields = {
      1: { label: 'test', type: 'string', colour: 'red' }, // ok
      2: { label: 'test', type: 'string' }, // duplicate label
      3: { label: '', type: 'string' }, // missing colour
      4: { type: 'string', colour: '' }, // missing label
    } as CustomFields;

    const result = parseCustomFields({ customFields }, errorEmitter);
    expect(result).toMatchObject({
      test: {
        label: 'test',
        type: 'string',
        colour: 'red',
      },
    });
    expect(errorEmitter).toHaveBeenCalled();
  });
});

describe('sanitiseOscSubscriptions()', () => {
  it('throws if not an array an empty array if not an array', () => {
    expect(() => sanitiseOscSubscriptions(undefined)).toThrow();
    // @ts-expect-error -- data is external, we check bad types
    expect(() => sanitiseOscSubscriptions({})).toThrow();
    expect(() => sanitiseOscSubscriptions(null)).toThrow();
  });

  it('returns an array of valid entries', () => {
    const oscSubscriptions: OscSubscription[] = [
      { id: '1', cycle: 'onLoad', address: '/test', payload: 'test', enabled: true },
      { id: '2', cycle: 'onStart', address: '/test', payload: 'test', enabled: false },
      { id: '3', cycle: 'onPause', address: '/test', payload: 'test', enabled: true },
      { id: '4', cycle: 'onStop', address: '/test', payload: 'test', enabled: false },
      { id: '5', cycle: 'onUpdate', address: '/test', payload: 'test', enabled: true },
      { id: '6', cycle: 'onFinish', address: '/test', payload: 'test', enabled: false },
      { id: '7', cycle: 'onWarning', address: '/test', payload: 'test', enabled: false },
      { id: '8', cycle: 'onDanger', address: '/test', payload: 'test', enabled: false },
    ];
    const sanitationResult = sanitiseOscSubscriptions(oscSubscriptions);
    expect(sanitationResult).toStrictEqual(oscSubscriptions);
  });

  it('filters invalid entries', () => {
    const oscSubscriptions = [
      { id: '1', cycle: 'onLoad', address: 4, payload: 'test', enabled: true },
      { cycle: 'onLoad', payload: 'test', enabled: true },
      { id: '2', cycle: 'unknown', payload: 'test', enabled: false },
      { id: '3', payload: 'test', enabled: true },
      { id: '4', cycle: 'onStop', enabled: false },
      { id: '5', cycle: 'onUpdate', payload: 'test' },
      { id: '6', cycle: 'onFinish', payload: 'test', enabled: 'true' },
    ] as OscSubscription[];
    const sanitationResult = sanitiseOscSubscriptions(oscSubscriptions);
    expect(sanitationResult.length).toBe(0);
  });
});

describe('sanitiseHttpSubscriptions()', () => {
  it('throws if the data is unexpected', () => {
    expect(() => sanitiseHttpSubscriptions(undefined)).toThrow();
    // @ts-expect-error -- data is external, we check bad types
    expect(() => sanitiseHttpSubscriptions({})).toThrow();
    expect(() => sanitiseHttpSubscriptions(null)).toThrow();
  });

  it('returns an array of valid entries', () => {
    const httpSubscription: HttpSubscription[] = [
      { id: '1', cycle: 'onLoad', message: 'http://test', enabled: true },
      { id: '2', cycle: 'onStart', message: 'http://test', enabled: false },
      { id: '3', cycle: 'onPause', message: 'http://test', enabled: true },
      { id: '4', cycle: 'onStop', message: 'http://test', enabled: false },
      { id: '5', cycle: 'onUpdate', message: 'http://test', enabled: true },
      { id: '6', cycle: 'onFinish', message: 'http://test', enabled: false },
      { id: '7', cycle: 'onWarning', message: 'http://test', enabled: false },
      { id: '8', cycle: 'onDanger', message: 'http://test', enabled: false },
    ];
    const sanitationResult = sanitiseHttpSubscriptions(httpSubscription);
    expect(sanitationResult).toStrictEqual(httpSubscription);
  });

  it('filters invalid entries', () => {
    const httpSubscription = [
      { cycle: 'onLoad', message: 'http://test', enabled: true },
      { id: '2', cycle: 'unknown', message: 'http://test', enabled: false },
      { id: '3', message: 'http://test', enabled: true },
      { id: '4', cycle: 'onStop', enabled: false },
      { id: '5', cycle: 'onUpdate', message: 'http://test' },
      { id: '6', cycle: 'onFinish', message: 'ftp://test', enabled: 'true' },
    ];
    const sanitationResult = sanitiseHttpSubscriptions(httpSubscription as HttpSubscription[]);
    expect(sanitationResult.length).toBe(0);
  });
});

describe('sanitiseCustomFields()', () => {
  it('returns an empty array if not an array', () => {
    expect(sanitiseCustomFields({})).toEqual({});
  });

  it('returns an object of valid entries', () => {
    const customFields: CustomFields = {
      test: { label: 'test', type: 'string', colour: 'red' },
      test2: { label: 'test2', type: 'string', colour: 'green' },
      test3: { label: 'Test3', type: 'string', colour: '' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(customFields);
  });

  it('type is forced to be string', () => {
    const customFields: CustomFields = {
      // @ts-expect-error intentional bad data
      test: { label: 'test', type: 'another', colour: 'red' },
    };
    const expectedCustomFields: CustomFields = {
      test: { label: 'test', type: 'string', colour: 'red' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(expectedCustomFields);
  });

  it('colour must be a string', () => {
    const customFields: CustomFields = {
      // @ts-expect-error intentional bad data
      test: { label: 'test', type: 'string', colour: 5 },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual({});
  });

  it('label can not be empty', () => {
    const customFields: CustomFields = {
      '': { label: '', type: 'string', colour: 'red' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual({});
  });

  it('remove extra stuff', () => {
    const customFields: CustomFields = {
      // @ts-expect-error intentional bad data
      test: { label: 'test', type: 'string', colour: 'red', extra: 'should be removed' },
    };
    const expectedCustomFields: CustomFields = {
      test: { label: 'test', type: 'string', colour: 'red' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(expectedCustomFields);
  });

  it('enforce name cohesion', () => {
    const customFields: CustomFields = {
      test: { label: 'New Name', type: 'string', colour: 'red' },
    };
    const expectedCustomFields: CustomFields = {
      'new name': { label: 'New Name', type: 'string', colour: 'red' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(expectedCustomFields);
  });

  it('filters invalid entries', () => {
    const customFields: CustomFields = {
      test: { label: 'test', type: 'string', colour: 'red' },
      test2: { label: 'test2', type: 'string', colour: 'green' },
      bad: { label: '', type: 'string', colour: '' },
      test3: { label: 'Test3', type: 'string', colour: '' },
    };
    const expectedCustomFields: CustomFields = {
      test: { label: 'test', type: 'string', colour: 'red' },
      test2: { label: 'test2', type: 'string', colour: 'green' },
      test3: { label: 'Test3', type: 'string', colour: '' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(expectedCustomFields);
  });
});

describe('parseRundown() linking', () => {
  const blankEvent: OntimeEvent = {
    id: '',
    type: SupportedEvent.Event,
    cue: '',
    title: '',
    note: '',
    endAction: EndAction.None,
    timerType: TimerType.CountDown,
    linkStart: null,
    timeStrategy: TimeStrategy.LockDuration,
    timeStart: 0,
    timeEnd: 0,
    duration: 0,
    isPublic: false,
    skip: false,
    colour: '',
    revision: 0,
    timeWarning: 120000,
    timeDanger: 60000,
    custom: {},
  };

  it('returns linked events', () => {
    const data: Partial<DatabaseModel> = {
      rundown: [
        {
          id: '1',
          type: SupportedEvent.Event,
          skip: false,
        } as OntimeEvent,
        {
          id: '2',
          type: SupportedEvent.Event,
          linkStart: 'true',
          skip: false,
        } as OntimeEvent,
      ],
      customFields: {},
    };

    const expected: OntimeRundown = [
      { ...blankEvent, id: '1', cue: '0' },
      { ...blankEvent, id: '2', cue: '1', linkStart: '1' },
    ];
    const result = parseRundown(data);
    expect(result.rundown).toEqual(expected);
  });

  it('returns unlinked if no previous', () => {
    const data: Partial<DatabaseModel> = {
      rundown: [
        {
          id: '2',
          type: SupportedEvent.Event,
          linkStart: 'true',
          skip: false,
        } as OntimeEvent,
      ],
      customFields: {},
    };

    const expected: OntimeRundown = [{ ...blankEvent, id: '2', cue: '0' }];
    const result = parseRundown(data);
    expect(result.rundown).toEqual(expected);
  });

  it('returns linked events past blocks and delays', () => {
    const data: Partial<DatabaseModel> = {
      rundown: [
        {
          id: '1',
          type: SupportedEvent.Event,
          skip: false,
        } as OntimeEvent,
        {
          id: 'delay1',
          type: SupportedEvent.Delay,
          duration: 0,
        },
        {
          id: '2',
          type: SupportedEvent.Event,
          linkStart: 'true',
          skip: false,
        } as OntimeEvent,
        {
          id: 'block1',
          type: SupportedEvent.Block,
          title: '',
        },
        {
          id: '3',
          type: SupportedEvent.Event,
          linkStart: 'true',
          skip: false,
        } as OntimeEvent,
      ],
      customFields: {},
    };

    const expected: OntimeRundown = [
      { ...blankEvent, id: '1', cue: '0' },
      { id: 'delay1', type: SupportedEvent.Delay, duration: 0 },
      { ...blankEvent, id: '2', cue: '1', linkStart: '1' },
      { id: 'block1', type: SupportedEvent.Block, title: '' },
      { ...blankEvent, id: '3', cue: '2', linkStart: '2' },
    ];
    const result = parseRundown(data);
    expect(result.rundown).toEqual(expected);
  });
});
