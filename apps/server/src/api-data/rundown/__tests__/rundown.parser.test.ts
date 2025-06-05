import { SupportedEntry, OntimeEvent, OntimeBlock, Rundown } from 'ontime-types';

import { defaultRundown } from '../../../models/dataModel.js';
import { makeOntimeBlock, makeOntimeEvent } from '../__mocks__/rundown.mocks.js';

import { parseRundowns, parseRundown } from '../rundown.parser.js';

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
      flatOrder: ['1', '2', '3', '4'],
      entries: {
        '1': { id: '1', type: SupportedEntry.Event, title: 'test', skip: false } as OntimeEvent, // OK
        '2': { id: '1', type: SupportedEntry.Block, title: 'test 2', skip: false } as OntimeBlock, // duplicate ID
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

  it('parses events nested in blocks', () => {
    const rundown = {
      id: 'test',
      title: '',
      order: ['block'],
      flatOrder: ['block'],
      entries: {
        block: makeOntimeBlock({ id: 'block', events: ['1', '2'] }),
        '1': makeOntimeEvent({ id: '1' }),
        '2': makeOntimeEvent({ id: '2' }),
      },
      revision: 1,
    } as Rundown;

    const parsedRundown = parseRundown(rundown, {});
    expect(parsedRundown.order.length).toEqual(1);
    expect(parsedRundown.entries.block).toMatchObject({ events: ['1', '2'] });
    expect(Object.keys(parsedRundown.entries).length).toEqual(3);
  });
});
