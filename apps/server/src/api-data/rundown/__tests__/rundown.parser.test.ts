import { CustomFields, OntimeEvent, OntimeGroup, Rundown, SupportedEntry } from 'ontime-types';

import { makeNewRundown } from '../../../models/dataModel.js';

import { makeOntimeEvent, makeOntimeGroup, makeOntimeMilestone } from '../__mocks__/rundown.mocks.js';
import { parseRundown, parseRundowns, sanitiseCustomFields } from '../rundown.parser.js';

describe('parseRundowns()', () => {
  it('returns a default project rundown if nothing is given', () => {
    const errorEmitter = vi.fn();
    const defaultRundown = makeNewRundown();
    const result = parseRundowns({}, {}, errorEmitter);
    const rundownIds = Object.keys(result);

    expect(rundownIds).toHaveLength(1);
    expect(result[rundownIds[0]]).toMatchObject({
      id: rundownIds[0],
      title: defaultRundown.title,
      order: expect.any(Array),
      entries: expect.any(Object),
    });

    // one for not having custom fields
    // one for not having a rundown
    expect(errorEmitter).toHaveBeenCalledTimes(1);
  });

  it('ensures the rundown IDs are consistent', () => {
    const errorEmitter = vi.fn();
    const defaultRundown = makeNewRundown();
    const r1 = { ...defaultRundown, id: '1' };
    const r2 = { ...defaultRundown, id: '2' };
    const result = parseRundowns(
      {
        rundowns: {
          '1': r1,
          '3': r2,
        },
      },
      {},
      errorEmitter,
    );
    expect(result).toMatchObject({
      '1': r1,
      '2': r2,
    });
    expect(errorEmitter).toHaveBeenCalledTimes(0);
  });
});

describe('parseRundown()', () => {
  it('parses data, skipping invalid results', () => {
    const errorEmitter = vi.fn();
    const rundown = {
      id: '',
      title: '',
      order: ['1', '2', '3', '4'],
      flatOrder: ['1', '2', '3', '4'],
      entries: {
        '1': { id: '1', type: SupportedEntry.Event, title: 'test', skip: false } as OntimeEvent, // OK
        '2': { id: '1', type: SupportedEntry.Group, title: 'test 2' } as OntimeGroup, // duplicate ID
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
        type: SupportedEntry.Event,
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
      flatOrder: ['1', '2'],
      entries: {
        // @ts-expect-error -- testing external data which could be incorrect
        '1': { id: '1', type: SupportedEntry.Event, cue: 101 } as OntimeEvent,
        // @ts-expect-error -- testing external data which could be incorrect
        '2': { id: '2', type: SupportedEntry.Event, cue: 101.1 } as OntimeEvent,
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
      flatOrder: ['1', '1'],
      entries: {
        '1': { id: '1', type: SupportedEntry.Event } as OntimeEvent,
        '2': { id: '2', type: SupportedEntry.Event } as OntimeEvent,
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
      flatOrder: ['1', '2'],
      entries: {
        '1': { id: '1', type: SupportedEntry.Event } as OntimeEvent,
        '2': { id: '2', type: SupportedEntry.Event } as OntimeEvent,
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
      flatOrder: ['1', '2', '3', '4'],
      entries: {
        '1': { id: '1', type: SupportedEntry.Event } as OntimeEvent,
        '2': { id: '2', type: SupportedEntry.Event } as OntimeEvent,
        'not-mentioned': {} as OntimeEvent,
      },
      revision: 1,
    } as Rundown;

    const parsedRundown = parseRundown(rundown, {});
    expect(parsedRundown.order.length).toEqual(2);
    expect(Object.keys(parsedRundown.entries).length).toEqual(2);
  });

  it('handles empty events', () => {
    const rundown = {
      id: 'test',
      title: '',
      order: ['1', '2', '3', '4'],
      flatOrder: ['1', '2', '3', '4'],
      entries: {
        '1': { id: '1', type: SupportedEntry.Event } as OntimeEvent,
        '2': { id: '2', type: SupportedEntry.Event } as OntimeEvent,
        'not-mentioned': {} as OntimeEvent,
      },
      revision: 1,
    } as Rundown;

    const parsedRundown = parseRundown(rundown, {});
    expect(parsedRundown.order.length).toEqual(2);
    expect(Object.keys(parsedRundown.entries).length).toEqual(2);
  });

  it('parses customFields', () => {
    const rundown = {
      id: 'test',
      title: '',
      order: ['1', '2'],
      flatOrder: ['1', '2'],
      entries: {
        '1': makeOntimeEvent({ id: '1', custom: { lighting: 'on' } }),
        '2': makeOntimeEvent({ id: '2', custom: { sound: 'loud' } }),
      },
      revision: 1,
    } as Rundown;

    const customFields: CustomFields = {
      lighting: {
        type: 'text',
        colour: 'red',
        label: 'lighting',
      },
      sound: {
        type: 'text',
        colour: 'red',
        label: 'sound',
      },
    };

    const parsedRundown = parseRundown(rundown, customFields);
    expect((parsedRundown.entries['1'] as OntimeEvent).custom).toStrictEqual({ lighting: 'on' });
    expect((parsedRundown.entries['2'] as OntimeEvent).custom).toStrictEqual({ sound: 'loud' });
  });

  it('removes empty custom fields', () => {
    const rundown = {
      id: 'test',
      title: '',
      order: ['1', '2'],
      flatOrder: ['1', '2', '21'],
      entries: {
        '1': makeOntimeEvent({ id: '1', custom: { lighting: 'yes' } }),
        '2': makeOntimeGroup({ id: '2', entries: ['21'], custom: { lighting: '' } }),
        '21': makeOntimeEvent({ id: '21', custom: { lighting: '' } }),
      },
      revision: 1,
    } as Rundown;

    const customFields: CustomFields = {
      lighting: {
        type: 'text',
        colour: 'red',
        label: 'lighting',
      },
    };

    const parsedRundown = parseRundown(rundown, customFields);
    expect((parsedRundown.entries['1'] as OntimeEvent).custom).toStrictEqual({ lighting: 'yes' });
    expect((parsedRundown.entries['2'] as OntimeGroup).custom).not.toHaveProperty('lighting');
    expect((parsedRundown.entries['21'] as OntimeEvent).custom).not.toHaveProperty('lighting');
  });

  it('parses data in groups', () => {
    const rundown = {
      id: 'test',
      title: '',
      order: ['group'],
      flatOrder: ['group'],
      isNextDay: false,
      entries: {
        group: makeOntimeGroup({
          id: 'group',
          title: 'group-title',
          note: 'group-note',
          colour: 'red',
          entries: ['1', '2', '3'],
        }),
        '1': makeOntimeEvent({ id: '1', parent: 'group' }),
        '2': makeOntimeMilestone({ id: '2', parent: 'group' }),
      },
      revision: 1,
    } as Rundown;

    const parsedRundown = parseRundown(rundown, {});
    expect(parsedRundown.order).toStrictEqual(['group']);
    expect(parsedRundown.flatOrder).toStrictEqual(['group', '1', '2']);
    expect(parsedRundown.entries).toMatchObject({
      group: { id: 'group', type: SupportedEntry.Group, entries: ['1', '2'] },
      '1': { id: '1', type: SupportedEntry.Event },
      '2': { id: '2', type: SupportedEntry.Milestone },
    });
  });

  it('parses events nested in groups', () => {
    const rundown = {
      id: 'test',
      title: '',
      order: ['group'],
      flatOrder: ['group'],
      entries: {
        group: makeOntimeGroup({ id: 'group', entries: ['1', '2'] }),
        '1': makeOntimeEvent({ id: '1' }),
        '2': makeOntimeEvent({ id: '2' }),
      },
      revision: 1,
    } as Rundown;

    const parsedRundown = parseRundown(rundown, {});
    expect(parsedRundown.order.length).toEqual(1);
    expect(parsedRundown.entries.group).toMatchObject({ entries: ['1', '2'] });
    expect(Object.keys(parsedRundown.entries).length).toEqual(3);
  });
});

describe('sanitiseCustomFields()', () => {
  it('deletes unused custom fields', () => {
    const customFields = {
      lighting: {
        type: 'text',
        colour: 'red',
        label: 'lighting',
      },
      sound: {
        type: 'text',
        colour: 'red',
        label: 'sound',
      },
    } as CustomFields;

    const event = makeOntimeEvent({
      type: SupportedEntry.Event,
      id: '2',
      timeStart: 0,
      linkStart: true,
      custom: {
        lighting: 'on',
        unknown: 'does-not-exist',
      },
    });

    sanitiseCustomFields(customFields, event);
    expect(event.custom).toStrictEqual({
      lighting: 'on',
    });
  });
});
