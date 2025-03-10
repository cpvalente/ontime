import {
  CustomFields,
  DatabaseModel,
  OntimeEvent,
  OntimeRundown,
  Settings,
  SupportedEvent,
  URLPreset,
} from 'ontime-types';

import {
  parseCustomFields,
  parseProject,
  parseRundown,
  parseSettings,
  parseUrlPresets,
  parseViewSettings,
  sanitiseCustomFields,
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
    });
    expect(errorEmitter).not.toHaveBeenCalled();
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

  it('allow old keys', () => {
    const customFields: CustomFields = {
      test: { label: 'Test', type: 'string', colour: 'red' },
    };
    const expectedCustomFields: CustomFields = {
      test: { label: 'Test', type: 'string', colour: 'red' },
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

    const result = parseRundown(data);
    expect(result.rundown[1]).toMatchObject({
      id: '2',
      linkStart: '1',
    });
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

    const result = parseRundown(data);
    expect(result.rundown[0]).toMatchObject({
      id: '2',
      linkStart: null,
    });
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

    const result = parseRundown(data);
    expect(result.rundown[0]).toMatchObject({
      id: '1',
      cue: '1',
    });
    // skip delay
    expect(result.rundown[2]).toMatchObject({
      id: '2',
      cue: '2',
      linkStart: '1',
    });
    // skip block
    expect(result.rundown[4]).toMatchObject({
      id: '3',
      cue: '3',
      linkStart: '2',
    });
  });
});
