import {
  SupportedEntry,
  OntimeEvent,
  OntimeBlock,
  Rundown,
  CustomFields,
  EntryId,
  PlayableEvent,
  EntryCustomFields,
} from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { defaultRundown } from '../../../models/dataModel.js';

import { makeOntimeBlock, makeOntimeDelay, makeOntimeEvent } from '../__mocks__/rundown.mocks.js';
import {
  parseRundowns,
  parseRundown,
  handleCustomField,
  addToCustomAssignment,
  makeRundownMetadata,
} from '../rundown.parser.js';

describe('parseRundowns()', () => {
  it('returns a default project rundown if nothing is given', () => {
    const errorEmitter = vi.fn();
    const result = parseRundowns({}, {}, errorEmitter);
    expect(result).toStrictEqual({ default: defaultRundown });
    // one for not having custom fields
    // one for not having a rundown
    expect(errorEmitter).toHaveBeenCalledTimes(1);
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
        '2': { id: '1', type: SupportedEntry.Block, title: 'test 2' } as OntimeBlock, // duplicate ID
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
        type: 'string',
        colour: 'red',
        label: 'lighting',
      },
      sound: {
        type: 'string',
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
        '2': makeOntimeBlock({ id: '2', entries: ['21'], custom: { lighting: '' } }),
        '21': makeOntimeEvent({ id: '21', custom: { lighting: '' } }),
      },
      revision: 1,
    } as Rundown;

    const customFields: CustomFields = {
      lighting: {
        type: 'string',
        colour: 'red',
        label: 'lighting',
      },
    };

    const parsedRundown = parseRundown(rundown, customFields);
    expect((parsedRundown.entries['1'] as OntimeEvent).custom).toStrictEqual({ lighting: 'yes' });
    expect((parsedRundown.entries['2'] as OntimeBlock).custom).not.toHaveProperty('lighting');
    expect((parsedRundown.entries['21'] as OntimeEvent).custom).not.toHaveProperty('lighting');
  });

  it('parses data in blocks', () => {
    const rundown = {
      id: 'test',
      title: '',
      order: ['block'],
      flatOrder: ['block'],
      isNextDay: false,
      entries: {
        block: makeOntimeBlock({
          id: 'block',
          title: 'block-title',
          note: 'block-note',
          colour: 'red',
          entries: ['1', '2'],
        }),
        '1': makeOntimeEvent({ id: '1' }),
      },
      revision: 1,
    } as Rundown;

    const parsedRundown = parseRundown(rundown, {});
    expect(parsedRundown.order.length).toEqual(1);
    expect(parsedRundown.entries.block).toMatchObject({
      title: 'block-title',
      note: 'block-note',
      colour: 'red',
      entries: ['1'],
    });
  });

  it('parses events nested in blocks', () => {
    const rundown = {
      id: 'test',
      title: '',
      order: ['block'],
      flatOrder: ['block'],
      entries: {
        block: makeOntimeBlock({ id: 'block', entries: ['1', '2'] }),
        '1': makeOntimeEvent({ id: '1' }),
        '2': makeOntimeEvent({ id: '2' }),
      },
      revision: 1,
    } as Rundown;

    const parsedRundown = parseRundown(rundown, {});
    expect(parsedRundown.order.length).toEqual(1);
    expect(parsedRundown.entries.block).toMatchObject({ entries: ['1', '2'] });
    expect(Object.keys(parsedRundown.entries).length).toEqual(3);
  });
});

describe('addToCustomAssignment()', () => {
  it('adds given entry to assignedCustomFields', () => {
    const assignedCustomFields = {};

    addToCustomAssignment('label1', 'eventId 1', assignedCustomFields);
    expect(assignedCustomFields).toStrictEqual({ label1: ['eventId 1'] });

    addToCustomAssignment('label1', 'eventId 2', assignedCustomFields);
    expect(assignedCustomFields).toStrictEqual({ label1: ['eventId 1', 'eventId 2'] });
  });
});

describe('handleCustomField()', () => {
  it('creates a map of where custom fields are used', () => {
    const customFields = {
      lighting: {
        type: 'string',
        colour: 'red',
        label: 'lighting',
      },
      sound: {
        type: 'string',
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
      },
    });
    const assignedCustomFields = {};

    const result = handleCustomField(customFields, event, assignedCustomFields);
    expect(result).toBeUndefined();
    expect(assignedCustomFields).toStrictEqual({ lighting: ['2'] });
    expect(event.custom).toStrictEqual({
      lighting: 'on',
    });
  });
});

describe('makeRundownMetadata()', () => {
  const customFields: CustomFields = {
    lighting: {
      type: 'string',
      colour: 'red',
      label: 'lighting',
    },
  };

  it('initializes with default empty values', () => {
    const { getMetadata } = makeRundownMetadata(customFields);
    const metadata = getMetadata();

    expect(metadata).toMatchObject({
      totalDelay: 0,
      totalDuration: 0,
      totalDays: 0,
      firstStart: null,
      lastEnd: null,
      previousEvent: null,
      latestEvent: null,
      previousEntry: null,
      assignedCustomFields: {},
      playableEventOrder: [],
      timedEventOrder: [],
      flatEntryOrder: [],
      entries: {},
      order: [],
    });
  });

  it('processes single playable event', () => {
    const { process, getMetadata } = makeRundownMetadata(customFields);
    const event = makeOntimeEvent({
      id: '1',
      timeStart: 0,
      duration: 100,
      timeEnd: 100,
    });

    process(event, null, false);
    const metadata = getMetadata();

    expect(metadata.totalDuration).toBe(100);
    expect(metadata.firstStart).toBe(0);
    expect(metadata.lastEnd).toBe(100);
    expect(metadata.playableEventOrder).toEqual(['1']);
    expect(metadata.timedEventOrder).toEqual(['1']);
    expect(metadata.flatEntryOrder).toEqual(['1']);
    expect(metadata.order).toEqual(['1']);
  });

  it('processes linked events', () => {
    const { process, getMetadata } = makeRundownMetadata(customFields);

    const event1 = makeOntimeEvent({
      id: '1',
      timeStart: 0,
      duration: 100,
      timeEnd: 100,
    });

    const event2 = makeOntimeEvent({
      id: '2',
      timeStart: 75, // <--- this should be changed to link
      duration: 100,
      timeEnd: 200,
      linkStart: true,
    });

    process(event1, null, false);
    process(event2, null, false);
    const metadata = getMetadata();

    // The totalDuration is calculated from the latest event's timeEnd
    expect(metadata.totalDuration).toBe(200);
    expect(metadata.firstStart).toBe(0);
    expect(metadata.lastEnd).toBe(200);
    expect(metadata.playableEventOrder).toEqual(['1', '2']);
    expect(metadata.timedEventOrder).toEqual(['1', '2']);
    expect(metadata.order).toEqual(['1', '2']);

    // Linked event times
    const processedEvent2 = metadata.entries['2'] as PlayableEvent;
    expect(processedEvent2.timeStart).toBe(100);
    expect(processedEvent2.timeEnd).toBe(200);
    expect(processedEvent2.duration).toBe(100);
  });

  it('processes events with custom fields', () => {
    const { process, getMetadata } = makeRundownMetadata(customFields);

    const event = makeOntimeEvent({
      id: '1',
      timeStart: 0,
      duration: 100,
      timeEnd: 100,
      custom: {
        lighting: 'red gels',
        unknownField: 'should be removed', // This field should be removed since it's not in customFields
      } as EntryCustomFields,
    });

    process(event, null, false);
    const metadata = getMetadata();

    // Should track events using valid custom fields
    expect(metadata.assignedCustomFields).toHaveProperty('lighting');
    expect(metadata.assignedCustomFields.lighting).toEqual(['1']);

    // Field validation is handled by the cleanupCustomFields utility
    const processedEvent = metadata.entries['1'] as OntimeEvent;
    expect(processedEvent.custom).toBeDefined();
    expect(processedEvent.custom).toHaveProperty('lighting', 'red gels');
  });

  it('processes events within blocks', () => {
    const { process, getMetadata } = makeRundownMetadata(customFields);

    const block = makeOntimeBlock({
      id: 'block1',
      title: 'Test Block',
      entries: ['1', '2'],
    });

    const event1 = makeOntimeEvent({
      id: '1',
      timeStart: 0,
      duration: 100,
      timeEnd: 100,
      parent: 'block1' as EntryId,
    });

    const event2 = makeOntimeEvent({
      id: '2',
      timeStart: 200,
      duration: 100,
      timeEnd: 300,
      parent: 'block1' as EntryId,
    });

    // Process block and its events
    process(block, null, false);
    process(event1, block, true);
    process(event2, block, false);

    const metadata = getMetadata();

    // Events should be properly ordered, including the block
    expect(metadata.flatEntryOrder).toEqual(['block1', '1', '2']);
    expect(metadata.playableEventOrder).toEqual(['1', '2']);
    expect(metadata.timedEventOrder).toEqual(['1', '2']);

    // Total duration should include both events and any gaps
    expect(metadata.totalDuration).toBe(300);

    // Block should be present in the entries
    const processedBlock = metadata.entries['block1'] as OntimeBlock;
    expect(processedBlock.type).toBe(SupportedEntry.Block);
    expect(processedBlock.entries).toEqual(['1', '2']);

    // Events should reference their parent block
    const processedEvent1 = metadata.entries['1'] as OntimeEvent;
    const processedEvent2 = metadata.entries['2'] as OntimeEvent;
    expect(processedEvent1.parent).toBe('block1');
    expect(processedEvent2.parent).toBe('block1');
  });

  it('processes nested rundown data', () => {
    const demoEvents = {
      '1': makeOntimeEvent({
        id: '1',
        parent: null,
        timeStart: 0,
        timeEnd: 1,
        duration: 1,
        dayOffset: 0,
        gap: 0,
        skip: false,
        linkStart: false,
      }),
      block: makeOntimeBlock({
        id: 'block',
        entries: ['11', 'delay', '12', '13'],
        colour: 'red',
      }),
      '11': makeOntimeEvent({
        id: '11',
        parent: 'block',
        timeStart: 10,
        timeEnd: 11,
        duration: 1,
        dayOffset: 0,
        gap: 10,
        skip: false,
        linkStart: false,
      }),
      delay: makeOntimeDelay({ id: 'delay', parent: 'block', duration: 10 }),
      '12': makeOntimeEvent({
        id: '12',
        parent: 'block',
        timeStart: 11,
        timeEnd: 12,
        duration: 1,
        dayOffset: 0,
        gap: 0,
        skip: false,
        linkStart: true,
      }),
      '13': makeOntimeEvent({
        id: '13',
        parent: 'block',
        timeStart: 12,
        timeEnd: 13,
        duration: 1,
        dayOffset: 0,
        gap: 0,
        skip: false,
        linkStart: true,
      }),
      '2': makeOntimeEvent({
        id: '2',
        parent: null,
        timeStart: 20,
        timeEnd: 21,
        duration: 1,
        dayOffset: 0,
        gap: 7,
        skip: false,
        linkStart: false,
      }),
    };

    const { getMetadata, process } = makeRundownMetadata({});

    expect(getMetadata()).toStrictEqual({
      totalDelay: 0,
      totalDuration: 0,
      totalDays: 0,
      firstStart: null,
      lastEnd: null,
      previousEvent: null,
      latestEvent: null,
      previousEntry: null,
      assignedCustomFields: {},
      playableEventOrder: [],
      timedEventOrder: [],
      flatEntryOrder: [],
      entries: {},
      order: [],
    });

    process(demoEvents['1'], null, false);
    expect(getMetadata()).toStrictEqual({
      totalDelay: 0,
      totalDuration: 1,
      totalDays: 0,
      firstStart: 0,
      lastEnd: 1,
      previousEvent: expect.objectContaining({ id: '1' }),
      latestEvent: expect.objectContaining({ id: '1' }),
      previousEntry: expect.objectContaining({ id: '1' }),
      assignedCustomFields: {},
      playableEventOrder: ['1'],
      timedEventOrder: ['1'],
      flatEntryOrder: ['1'],
      entries: expect.objectContaining({ '1': expect.any(Object) }),
      order: ['1'],
    });

    process(demoEvents['block'], null, false);
    expect(getMetadata()).toMatchObject({
      totalDelay: 0,
      totalDuration: 1,
      totalDays: 0,
      firstStart: 0,
      lastEnd: 1,
      previousEvent: expect.objectContaining({ id: '1' }),
      latestEvent: expect.objectContaining({ id: '1' }),
      previousEntry: expect.objectContaining({ id: 'block' }),
      assignedCustomFields: {},
      playableEventOrder: ['1'],
      timedEventOrder: ['1'],
      flatEntryOrder: ['1', 'block'],
      entries: expect.objectContaining({ block: expect.any(Object) }),
      order: ['1', 'block'],
    });

    process(demoEvents['11'], demoEvents['block'], false);
    expect(getMetadata()).toMatchObject({
      totalDelay: 0,
      totalDuration: 11,
      totalDays: 0,
      firstStart: 0,
      lastEnd: 11,
      previousEvent: expect.objectContaining({ id: '11' }),
      latestEvent: expect.objectContaining({ id: '11' }),
      previousEntry: expect.objectContaining({ id: '11' }),
      assignedCustomFields: {},
      playableEventOrder: ['1', '11'],
      timedEventOrder: ['1', '11'],
      flatEntryOrder: ['1', 'block', '11'],
      entries: expect.objectContaining({ '11': expect.any(Object) }),
      order: ['1', 'block'],
    });

    process(demoEvents['delay'], demoEvents['block'], false);
    expect(getMetadata()).toMatchObject({
      totalDelay: 10,
      totalDuration: 11,
      totalDays: 0,
      firstStart: 0,
      lastEnd: 11,
      previousEvent: expect.objectContaining({ id: '11' }),
      latestEvent: expect.objectContaining({ id: '11' }),
      previousEntry: expect.objectContaining({ id: 'delay' }),
      assignedCustomFields: {},
      playableEventOrder: ['1', '11'],
      timedEventOrder: ['1', '11'],
      flatEntryOrder: ['1', 'block', '11', 'delay'],
      entries: expect.objectContaining({ delay: expect.any(Object) }),
      order: ['1', 'block'],
    });

    process(demoEvents['12'], demoEvents['block'], true);
    expect(getMetadata()).toMatchObject({
      totalDelay: 10,
      totalDuration: 12,
      totalDays: 0,
      firstStart: 0,
      lastEnd: 12,
      previousEvent: expect.objectContaining({ id: '12' }),
      latestEvent: expect.objectContaining({ id: '12' }),
      previousEntry: expect.objectContaining({ id: '12' }),
      assignedCustomFields: {},
      playableEventOrder: ['1', '11', '12'],
      timedEventOrder: ['1', '11', '12'],
      flatEntryOrder: ['1', 'block', '11', 'delay', '12'],
      entries: expect.objectContaining({ '12': expect.any(Object) }),
      order: ['1', 'block'],
    });

    process(demoEvents['13'], demoEvents['block'], false);
    expect(getMetadata()).toMatchObject({
      totalDelay: 10,
      totalDuration: 13,
      totalDays: 0,
      firstStart: 0,
      lastEnd: 13,
      previousEvent: expect.objectContaining({ id: '13' }),
      latestEvent: expect.objectContaining({ id: '13' }),
      previousEntry: expect.objectContaining({ id: '13' }),
      assignedCustomFields: {},
      playableEventOrder: ['1', '11', '12', '13'],
      timedEventOrder: ['1', '11', '12', '13'],
      flatEntryOrder: ['1', 'block', '11', 'delay', '12', '13'],
      entries: expect.objectContaining({ '13': expect.any(Object) }),
      order: ['1', 'block'],
    });

    process(demoEvents['2'], null, false);
    expect(getMetadata()).toMatchObject({
      totalDelay: 3, // delay reduced by gap
      totalDuration: 21,
      totalDays: 0,
      firstStart: 0,
      lastEnd: 21,
      previousEvent: expect.objectContaining({ id: '2' }),
      latestEvent: expect.objectContaining({ id: '2' }),
      previousEntry: expect.objectContaining({ id: '2' }),
      assignedCustomFields: {},
      playableEventOrder: ['1', '11', '12', '13', '2'],
      timedEventOrder: ['1', '11', '12', '13', '2'],
      flatEntryOrder: ['1', 'block', '11', 'delay', '12', '13', '2'],
      entries: expect.objectContaining({ '2': expect.any(Object) }),
      order: ['1', 'block', '2'],
    });
  });

  it('processes days in the rundown', () => {
    const demoEvents = {
      '1': makeOntimeEvent({
        id: '1',
        parent: null,
        timeStart: 23 * MILLIS_PER_HOUR,
        timeEnd: 1 * MILLIS_PER_HOUR,
        duration: 2 * MILLIS_PER_HOUR,
        linkStart: false,
      }),
      '2': makeOntimeEvent({
        id: '2',
        parent: null,
        timeStart: 2 * MILLIS_PER_HOUR,
        timeEnd: 3 * MILLIS_PER_HOUR,
        duration: 1 * MILLIS_PER_HOUR,
        linkStart: false,
      }),
      'block-1': makeOntimeBlock({
        id: 'block-1',
        entries: ['11'],
        isNextDay: false,
      }),
      '11': makeOntimeEvent({
        id: '11',
        parent: 'block-1',
        timeStart: 9 * MILLIS_PER_HOUR,
        timeEnd: 10 * MILLIS_PER_HOUR,
        duration: 1 * MILLIS_PER_HOUR,
      }),
      'block-2': makeOntimeBlock({
        id: 'block-2',
        entries: ['12'],
        isNextDay: true,
      }),
      '12': makeOntimeEvent({
        id: '12',
        parent: 'block-2',
        timeStart: 10 * MILLIS_PER_HOUR,
        timeEnd: 11 * MILLIS_PER_HOUR,
        duration: 1 * MILLIS_PER_HOUR,
        linkStart: true,
      }),
    };

    const { getMetadata, process } = makeRundownMetadata({});

    // first event crosses midnight
    process(demoEvents['1'], null, false);
    expect(getMetadata()).toMatchObject({
      totalDuration: 2 * MILLIS_PER_HOUR,
      totalDays: 0,
      firstStart: 23 * MILLIS_PER_HOUR,
      lastEnd: 1 * MILLIS_PER_HOUR,
    });

    // first event crosses midnight
    process(demoEvents['2'], null, false);
    expect(getMetadata()).toMatchObject({
      totalDuration: 4 * MILLIS_PER_HOUR,
      totalDays: 1,
      firstStart: 23 * MILLIS_PER_HOUR,
      lastEnd: 3 * MILLIS_PER_HOUR,
    });

    // block doesnt change the times
    process(demoEvents['block-1'], null, false);
    expect(getMetadata()).toMatchObject({
      totalDuration: 4 * MILLIS_PER_HOUR,
      totalDays: 1,
      firstStart: 23 * MILLIS_PER_HOUR,
      lastEnd: 3 * MILLIS_PER_HOUR,
    });

    process(demoEvents['11'], demoEvents['block-1'], true);
    expect(getMetadata()).toMatchObject({
      totalDuration: 11 * MILLIS_PER_HOUR,
      totalDays: 1,
      firstStart: 23 * MILLIS_PER_HOUR,
      lastEnd: 10 * MILLIS_PER_HOUR,
    });

    // block is flagged as isNextDay, time doesnt change yet...
    process(demoEvents['block-2'], null, false);
    expect(getMetadata()).toMatchObject({
      totalDuration: 11 * MILLIS_PER_HOUR,
      totalDays: 1,
      firstStart: 23 * MILLIS_PER_HOUR,
      lastEnd: 10 * MILLIS_PER_HOUR,
    });

    // ...but it goes escalated to the next event
    process(demoEvents['12'], demoEvents['block-2'], true);
    expect(getMetadata()).toMatchObject({
      totalDuration: (24 + 12) * MILLIS_PER_HOUR,
      totalDays: 2,
      firstStart: 23 * MILLIS_PER_HOUR,
      lastEnd: 11 * MILLIS_PER_HOUR,
    });
  });
});
