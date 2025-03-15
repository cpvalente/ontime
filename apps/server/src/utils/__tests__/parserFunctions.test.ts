import { CustomFields, OntimeBlock, OntimeEvent, Rundown, Settings, SupportedEvent, URLPreset } from 'ontime-types';

import { defaultRundown } from '../../models/dataModel.js';

import {
  parseCustomFields,
  parseProject,
  parseRundown,
  parseRundowns,
  parseSettings,
  parseUrlPresets,
  parseViewSettings,
  sanitiseCustomFields,
} from '../parserFunctions.js';

describe('parseRundowns()', () => {
  it('returns a default project rundown if nothing is given', () => {
    const errorEmitter = vi.fn();
    const result = parseRundowns({}, errorEmitter);
    expect(result.customFields).toEqual({});
    expect(result.rundowns).toStrictEqual({ default: defaultRundown });
    // one for not having custom fields
    // one for not having a rundown
    expect(errorEmitter).toHaveBeenCalledTimes(2);
  });

  it('ensures the rundown IDs are consistent', () => {
    const errorEmitter = vi.fn();
    const r1 = { ...defaultRundown, id: '1' };
    const r2 = { ...defaultRundown, id: '2' };
    const result = parseRundowns(
      {
        rundowns: {
          '1': r1,
          '3': r2,
        },
      },
      errorEmitter,
    );
    expect(result.rundowns).toMatchObject({
      '1': r1,
      '2': r2,
    });
    // one for not having a rundown
    expect(errorEmitter).toHaveBeenCalledTimes(1);
  });
});

describe('parseRundown()', () => {
  it('parses data, skipping invalid results', () => {
    const errorEmitter = vi.fn();
    const rundown = {
      id: '',
      title: '',
      order: ['1', '2', '3', '4'],
      entries: {
        '1': { id: '1', type: SupportedEvent.Event, title: 'test', skip: false } as OntimeEvent, // OK
        '2': { id: '1', type: SupportedEvent.Block, title: 'test 2', skip: false } as OntimeBlock, // duplicate ID
        '3': {} as OntimeEvent, // no data
        '4': { id: '4', title: 'test 2', skip: false } as OntimeEvent, // no type
      },
      revision: 1,
    } as Rundown;

    const parsedRundown = parseRundown(rundown, {}, errorEmitter);
    expect(parsedRundown.id).not.toBe('');
    expect(parsedRundown.id).toBeTypeOf('string');
    expect(parsedRundown.order.length).toEqual(1);
    expect(parsedRundown.order).toEqual(['1']);
    expect(parsedRundown.entries).toMatchObject({
      '1': {
        id: '1',
        type: SupportedEvent.Event,
        title: 'test',
        skip: false,
      },
    });
    expect(errorEmitter).toHaveBeenCalled();
  });

  it('stringifies necessary values', () => {
    const rundown = {
      id: '',
      title: '',
      order: ['1', '2'],
      entries: {
        // @ts-expect-error -- testing external data which could be incorrect
        '1': { id: '1', type: SupportedEvent.Event, cue: 101 } as OntimeEvent,
        // @ts-expect-error -- testing external data which could be incorrect
        '2': { id: '2', type: SupportedEvent.Event, cue: 101.1 } as OntimeEvent,
      },
      revision: 1,
    } as Rundown;

    expect(parseRundown(rundown, {})).toMatchObject({
      entries: {
        '1': {
          cue: '101',
        },
        '2': {
          cue: '101.1',
        },
      },
    });
  });

  it('detects duplicate Ids', () => {
    const rundown = {
      id: '',
      title: '',
      order: ['1', '1'],
      entries: {
        '1': { id: '1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', type: SupportedEvent.Event } as OntimeEvent,
      },
      revision: 1,
    } as Rundown;

    const parsedRundown = parseRundown(rundown, {});
    expect(parsedRundown.order.length).toEqual(1);
    expect(Object.keys(parsedRundown.entries).length).toEqual(1);
  });

  it('completes partial datasets', () => {
    const rundown = {
      id: 'test',
      title: '',
      order: ['1', '2'],
      entries: {
        '1': { id: '1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', type: SupportedEvent.Event } as OntimeEvent,
      },
      revision: 1,
    } as Rundown;

    const parsedRundown = parseRundown(rundown, {});
    expect(parsedRundown.order.length).toEqual(2);
    expect(parsedRundown.entries).toMatchObject({
      '1': {
        title: '',
        cue: '1',
        custom: {},
      },
      '2': {
        title: '',
        cue: '2',
        custom: {},
      },
    });
  });

  it('handles empty events', () => {
    const rundown = {
      id: 'test',
      title: '',
      order: ['1', '2', '3', '4'],
      entries: {
        '1': { id: '1', type: SupportedEvent.Event } as OntimeEvent,
        '2': { id: '2', type: SupportedEvent.Event } as OntimeEvent,
        'not-mentioned': {} as OntimeEvent,
      },
      revision: 1,
    } as Rundown;

    const parsedRundown = parseRundown(rundown, {});
    expect(parsedRundown.order.length).toEqual(2);
    expect(Object.keys(parsedRundown.entries).length).toEqual(2);
  });
});

describe('parseProject()', () => {
  it('returns an a base model if nothing is given', () => {
    const errorEmitter = vi.fn();
    const result = parseProject({}, errorEmitter);
    expect(result).toBeTypeOf('object');
    expect(errorEmitter).toHaveBeenCalledOnce();
  });

  it('test migration with adding the logo field v3.8.0', () => {
    const errorEmitter = vi.fn();
    const result = parseProject(
      {
        //@ts-expect-error -- checking migration when the logo field is added
        project: {
          title: 'title',
          description: 'description',
          publicUrl: 'publicUrl',
          publicInfo: 'publicInfo',
          backstageUrl: 'backstageUrl',
          backstageInfo: 'backstageInfo',
          custom: [],
        },
      },
      errorEmitter,
    );
    expect(result).toStrictEqual({
      title: 'title',
      description: 'description',
      publicUrl: 'publicUrl',
      publicInfo: 'publicInfo',
      backstageUrl: 'backstageUrl',
      backstageInfo: 'backstageInfo',
      projectLogo: null,
      custom: [],
    });
  });
});

describe('parseSettings()', () => {
  it('throws if settings object does not exist', () => {
    expect(() => parseSettings({})).toThrow();
  });

  it('returns an a base model as long as we have the app and version', () => {
    const result = parseSettings({ settings: { app: 'ontime', version: '1' } as Settings });
    expect(result).toBeTypeOf('object');
    expect(result).toMatchObject({
      app: 'ontime',
      version: expect.any(String),
      serverPort: 4001,
      editorKey: null,
      operatorKey: null,
      timeFormat: '24',
      language: 'en',
    });
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

describe('sanitiseCustomFields()', () => {
  it('returns an empty object the type is incorrect', () => {
    expect(sanitiseCustomFields({})).toEqual({});
  });

  it('returns an object of valid entries', () => {
    const customFields: CustomFields = {
      test: { label: 'test', type: 'string', colour: 'red' },
      test2: { label: 'test2', type: 'string', colour: 'green' },
      Test3: { label: 'Test3', type: 'string', colour: '' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(customFields);
  });

  it('type should be one of (image | string)', () => {
    const testTypes = sanitiseCustomFields({
      test1: { label: 'test1', type: 'another', colour: 'red' },
      test2: { label: 'test2', type: 'image', colour: 'red' },
      test3: { label: 'test3', type: 'string', colour: 'red' },
    });
    expect(testTypes).toMatchObject({
      test2: { label: 'test2', type: 'image', colour: 'red' },
      test3: { label: 'test3', type: 'string', colour: 'red' },
    });
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
      test: { label: 'NewName', type: 'string', colour: 'red' },
    };
    const expectedCustomFields: CustomFields = {
      NewName: { label: 'NewName', type: 'string', colour: 'red' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(expectedCustomFields);
  });

  it('labels with space', () => {
    const customFields: CustomFields = {
      Test_with_Space: { label: 'Test with Space', type: 'string', colour: 'red' },
    };
    const expectedCustomFields: CustomFields = {
      Test_with_Space: { label: 'Test with Space', type: 'string', colour: 'red' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(expectedCustomFields);
  });

  it('filters invalid entries', () => {
    const customFields: CustomFields = {
      test: { label: 'test', type: 'string', colour: 'red' },
      test2: { label: 'test2', type: 'string', colour: 'green' },
      bad: { label: '', type: 'string', colour: '' },
      Test3: { label: 'Test3', type: 'string', colour: '' },
    };
    const expectedCustomFields: CustomFields = {
      test: { label: 'test', type: 'string', colour: 'red' },
      test2: { label: 'test2', type: 'string', colour: 'green' },
      Test3: { label: 'Test3', type: 'string', colour: '' },
    };
    const sanitationResult = sanitiseCustomFields(customFields);
    expect(sanitationResult).toStrictEqual(expectedCustomFields);
  });
});

describe('parseRundown() linking', () => {
  it('returns linked events', () => {
    const rundown: Rundown = {
      id: '',
      title: '',
      revision: 1,
      order: ['1', '2'],
      entries: {
        '1': {
          id: '1',
          type: SupportedEvent.Event,
          skip: false,
        } as OntimeEvent,
        '2': {
          id: '2',
          type: SupportedEvent.Event,
          linkStart: 'true',
          skip: false,
        } as OntimeEvent,
      },
    };

    const result = parseRundown(rundown, {});
    expect(result).toMatchObject({
      order: ['1', '2'],
      entries: {
        '2': {
          linkStart: '1',
        },
      },
    });
  });

  it('returns unlinked if no previous', () => {
    const rundown: Rundown = {
      id: '',
      title: '',
      revision: 1,
      order: ['1', '2'],
      entries: {
        '2': {
          id: '2',
          type: SupportedEvent.Event,
          linkStart: 'true',
          skip: false,
        } as OntimeEvent,
      },
    };

    const result = parseRundown(rundown, {});
    expect(result).toMatchObject({
      order: ['2'],
      entries: {
        '2': {
          linkStart: null,
        },
      },
    });
  });

  it('returns linked events past blocks and delays', () => {
    const rundown: Rundown = {
      id: '',
      title: '',
      revision: 1,
      order: ['1', 'delay1', '2', 'block1', '3'],
      entries: {
        '1': {
          id: '1',
          type: SupportedEvent.Event,
          skip: false,
        } as OntimeEvent,
        delay1: {
          id: 'delay1',
          type: SupportedEvent.Delay,
          duration: 0,
        },
        '2': {
          id: '2',
          type: SupportedEvent.Event,
          linkStart: 'true',
          skip: false,
        } as OntimeEvent,
        block1: {
          id: 'block1',
          type: SupportedEvent.Block,
          title: '',
        } as OntimeBlock,
        '3': {
          id: '3',
          type: SupportedEvent.Event,
          linkStart: 'true',
          skip: false,
        } as OntimeEvent,
      },
    };

    const result = parseRundown(rundown, {});
    expect(result).toMatchObject({
      order: rundown.order,
      entries: {
        '1': {
          id: '1',
          cue: '1',
        },
        '2': {
          id: '2',
          cue: '2',
          linkStart: '1',
        },
        '3': {
          id: '3',
          cue: '3',
          linkStart: '2',
        },
      },
    });
  });
});
