import {
  CustomFields,
  DatabaseModel,
  EndAction,
  HttpSubscription,
  OntimeEvent,
  OntimeRundown,
  OscSubscription,
  SupportedEvent,
  TimeStrategy,
  TimerType,
} from 'ontime-types';
import {
  parseRundown,
  sanitiseCustomFields,
  sanitiseHttpSubscriptions,
  sanitiseOscSubscriptions,
} from '../parserFunctions.js';

describe('sanitiseOscSubscriptions()', () => {
  it('returns an empty array if not an array', () => {
    expect(sanitiseOscSubscriptions(undefined)).toEqual([]);
    // @ts-expect-error -- data is external, we check bad types
    expect(sanitiseOscSubscriptions({})).toEqual([]);
    expect(sanitiseOscSubscriptions(null)).toEqual([]);
  });

  it('returns an array of valid entries', () => {
    const oscSubscriptions: OscSubscription[] = [
      { id: '1', cycle: 'onLoad', address: '/test', payload: 'test', enabled: true },
      { id: '2', cycle: 'onStart', address: '/test', payload: 'test', enabled: false },
      { id: '3', cycle: 'onPause', address: '/test', payload: 'test', enabled: true },
      { id: '4', cycle: 'onStop', address: '/test', payload: 'test', enabled: false },
      { id: '5', cycle: 'onUpdate', address: '/test', payload: 'test', enabled: true },
      { id: '6', cycle: 'onFinish', address: '/test', payload: 'test', enabled: false },
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
    ];
    const sanitationResult = sanitiseOscSubscriptions(oscSubscriptions as OscSubscription[]);
    expect(sanitationResult.length).toBe(0);
  });
});

describe('sanitiseHttpSubscriptions()', () => {
  it('returns an empty array if not an array', () => {
    expect(sanitiseHttpSubscriptions(undefined)).toEqual([]);
    // @ts-expect-error -- data is external, we check bad types
    expect(sanitiseHttpSubscriptions({})).toEqual([]);
    expect(sanitiseHttpSubscriptions(null)).toEqual([]);
  });

  it('returns an array of valid entries', () => {
    const httpSubscription: HttpSubscription[] = [
      { id: '1', cycle: 'onLoad', message: 'http://test', enabled: true },
      { id: '2', cycle: 'onStart', message: 'http://test', enabled: false },
      { id: '3', cycle: 'onPause', message: 'http://test', enabled: true },
      { id: '4', cycle: 'onStop', message: 'http://test', enabled: false },
      { id: '5', cycle: 'onUpdate', message: 'http://test', enabled: true },
      { id: '6', cycle: 'onFinish', message: 'http://test', enabled: false },
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

  it('enforece name cohesion', () => {
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
        // @ts-expect-error - only the necessary parts
        {
          id: '1',
          type: SupportedEvent.Event,
          skip: false,
        },
        // @ts-expect-error - only the necessary parts
        {
          id: '2',
          type: SupportedEvent.Event,
          linkStart: 'true',
          skip: false,
        },
      ],
    };

    const expected: OntimeRundown = [
      { ...blankEvent, id: '1', cue: '0' },
      { ...blankEvent, id: '2', cue: '1', linkStart: '1' },
    ];
    const result = parseRundown(data);
    expect(result).toEqual(expected);
  });

  it('returns unlinkd if no previous', () => {
    const data: Partial<DatabaseModel> = {
      rundown: [
        // @ts-expect-error - only the necessary parts
        {
          id: '2',
          type: SupportedEvent.Event,
          linkStart: 'true',
          skip: false,
        },
      ],
    };

    const expected: OntimeRundown = [{ ...blankEvent, id: '2', cue: '0' }];
    const result = parseRundown(data);
    expect(result).toEqual(expected);
  });

  it('returns linked events even if its skipped', () => {
    const data: Partial<DatabaseModel> = {
      rundown: [
        // @ts-expect-error - only the necessary parts
        {
          id: '1',
          type: SupportedEvent.Event,
          skip: true,
        },
        // @ts-expect-error - only the necessary parts
        {
          id: '2',
          type: SupportedEvent.Event,
          linkStart: 'true',
          skip: false,
        },
      ],
    };

    const expected: OntimeRundown = [
      { ...blankEvent, id: '1', cue: '0' },
      { ...blankEvent, id: '2', cue: '1', linkStart: '1' },
    ];
    const result = parseRundown(data);
    expect(result).toEqual(expected);
  });

  it('returns linked events past blocks and delays', () => {
    const data: Partial<DatabaseModel> = {
      rundown: [
        // @ts-expect-error - only the necessary parts
        {
          id: '1',
          type: SupportedEvent.Event,
          skip: false,
        },
        {
          id: 'delay1',
          type: SupportedEvent.Delay,
          duration: 0,
        },
        // @ts-expect-error - only the necessary parts
        {
          id: '2',
          type: SupportedEvent.Event,
          linkStart: 'true',
          skip: false,
        },
        {
          id: 'block1',
          type: SupportedEvent.Block,
          title: '',
        },
        // @ts-expect-error - only the necessary parts
        {
          id: '3',
          type: SupportedEvent.Event,
          linkStart: 'true',
          skip: false,
        },
      ],
    };

    const expected: OntimeRundown = [
      { ...blankEvent, id: '1', cue: '0' },
      { id: 'delay1', type: SupportedEvent.Delay, duration: 0 },
      { ...blankEvent, id: '2', cue: '1', linkStart: '1' },
      { id: 'block1', type: SupportedEvent.Block, title: '' },
      { ...blankEvent, id: '3', cue: '2', linkStart: '2' },
    ];
    const result = parseRundown(data);
    expect(result).toEqual(expected);
  });
});
