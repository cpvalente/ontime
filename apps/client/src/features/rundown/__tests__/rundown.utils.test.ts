import { EntryId, OntimeBlock, OntimeDelay, OntimeEvent, RundownEntries, SupportedEntry } from 'ontime-types';

import { makeRundownMetadata, makeSortableList, moveDown, moveUp } from '../rundown.utils';

describe('makeRundownMetadata()', () => {
  it('processes nested rundown data', () => {
    const selectedEventId = '12';
    const demoEvents = {
      '1': {
        id: '1',
        type: SupportedEntry.Event,
        parent: null,
        timeStart: 0,
        timeEnd: 1,
        duration: 1,
        dayOffset: 0,
        gap: 0,
        skip: false,
        linkStart: false,
      } as OntimeEvent,
      block: {
        id: 'block',
        type: SupportedEntry.Block,
        events: ['11', 'delay', '12', '13'],
        colour: 'red',
      } as OntimeBlock,
      '11': {
        id: '11',
        type: SupportedEntry.Event,
        parent: 'block',
        timeStart: 10,
        timeEnd: 11,
        duration: 1,
        dayOffset: 0,
        gap: 10,
        skip: false,
        linkStart: false,
      } as OntimeEvent,
      delay: {
        id: 'delay',
        type: SupportedEntry.Delay,
        parent: 'block',
        duration: 0,
      } as OntimeDelay,
      '12': {
        id: '12',
        type: SupportedEntry.Event,
        parent: 'block',
        timeStart: 11,
        timeEnd: 12,
        duration: 1,
        dayOffset: 0,
        gap: 0,
        skip: false,
        linkStart: true,
      } as OntimeEvent,
      '13': {
        id: '13',
        type: SupportedEntry.Event,
        parent: 'block',
        timeStart: 12,
        timeEnd: 13,
        duration: 1,
        dayOffset: 0,
        gap: 0,
        skip: false,
        linkStart: true,
      } as OntimeEvent,
      '2': {
        id: '2',
        type: SupportedEntry.Event,
        parent: null,
        timeStart: 20,
        timeEnd: 21,
        duration: 1,
        dayOffset: 0,
        gap: 7,
        skip: false,
        linkStart: false,
      } as OntimeEvent,
    };

    const { metadata, process } = makeRundownMetadata(selectedEventId);

    expect(metadata).toStrictEqual({
      previousEvent: null,
      latestEvent: null,
      previousEntryId: null,
      thisId: null,
      eventIndex: 0,
      isPast: true,
      isNextDay: false,
      totalGap: 0,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: null,
      groupColour: undefined,
    });

    expect(process(demoEvents['1'])).toStrictEqual({
      previousEvent: null,
      latestEvent: demoEvents['1'],
      previousEntryId: null,
      thisId: demoEvents['1'].id,
      eventIndex: 1, // UI indexes are 1 based
      isPast: true,
      isNextDay: false,
      totalGap: 0,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: null,
      groupColour: undefined,
    });

    expect(process(demoEvents['block'])).toMatchObject({
      previousEvent: demoEvents['1'],
      latestEvent: demoEvents['1'],
      previousEntryId: demoEvents['1'].id,
      thisId: demoEvents['block'].id,
      eventIndex: 1,
      isPast: true,
      isNextDay: false,
      totalGap: 0,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: 'block',
      groupColour: 'red',
    });

    expect(process(demoEvents['11'])).toMatchObject({
      previousEvent: demoEvents['1'],
      latestEvent: demoEvents['11'],
      previousEntryId: demoEvents['block'].id,
      thisId: demoEvents['11'].id,
      eventIndex: 2,
      isPast: true,
      isNextDay: false,
      totalGap: 10,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: 'block',
      groupColour: 'red',
    });

    expect(process(demoEvents['delay'])).toMatchObject({
      previousEvent: demoEvents['11'],
      latestEvent: demoEvents['11'],
      previousEntryId: demoEvents['11'].id,
      thisId: demoEvents['delay'].id,
      eventIndex: 2,
      isPast: true,
      isNextDay: false,
      totalGap: 10,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: 'block',
      groupColour: 'red',
    });

    expect(process(demoEvents['12'])).toMatchObject({
      previousEvent: demoEvents['11'],
      latestEvent: demoEvents['12'],
      previousEntryId: demoEvents['delay'].id,
      thisId: demoEvents['12'].id,
      eventIndex: 3,
      isPast: false,
      isNextDay: false,
      totalGap: 10,
      isLinkedToLoaded: false,
      isLoaded: true,
      groupId: 'block',
      groupColour: 'red',
    });

    expect(process(demoEvents['13'])).toMatchObject({
      previousEvent: demoEvents['12'],
      latestEvent: demoEvents['13'],
      previousEntryId: demoEvents['12'].id,
      thisId: demoEvents['13'].id,
      eventIndex: 4,
      isPast: false,
      isNextDay: false,
      totalGap: 10,
      isLinkedToLoaded: true,
      isLoaded: false,
      groupId: 'block',
      groupColour: 'red',
    });

    expect(process(demoEvents['2'])).toMatchObject({
      previousEvent: demoEvents['13'],
      latestEvent: demoEvents['2'],
      previousEntryId: demoEvents['13'].id,
      thisId: demoEvents['2'].id,
      eventIndex: 5,
      isPast: false,
      isNextDay: false,
      totalGap: 17,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: null,
      groupColour: undefined,
    });
  });

  it('populates previousEntries in blocks', () => {
    const rundownStartsWithBlock = {
      block: {
        id: 'block',
        type: SupportedEntry.Block,
        colour: 'red',
        events: ['1', '2'],
      } as OntimeBlock,
      '1': {
        id: '1',
        type: SupportedEntry.Event,
        parent: 'block',
        timeStart: 1,
        timeEnd: 2,
        duration: 1,
        dayOffset: 0,
        gap: 0,
        skip: false,
        linkStart: false,
      } as OntimeEvent,
      '2': {
        id: '2',
        type: SupportedEntry.Event,
        parent: 'block',
        timeStart: 2,
        timeEnd: 3,
        duration: 1,
        dayOffset: 0,
        gap: 0,
        skip: false,
        linkStart: false,
      } as OntimeEvent,
    };
    const { process } = makeRundownMetadata(null);

    expect(process(rundownStartsWithBlock.block)).toStrictEqual({
      previousEvent: null,
      latestEvent: null,
      previousEntryId: null,
      thisId: rundownStartsWithBlock.block.id,
      eventIndex: 0,
      isPast: false,
      isNextDay: false,
      totalGap: 0,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: rundownStartsWithBlock.block.id,
      groupColour: 'red',
    });

    expect(process(rundownStartsWithBlock['1'])).toStrictEqual({
      previousEvent: null,
      latestEvent: rundownStartsWithBlock['1'],
      previousEntryId: rundownStartsWithBlock.block.id,
      thisId: rundownStartsWithBlock['1'].id,
      eventIndex: 1,
      isPast: false,
      isNextDay: false,
      totalGap: 0,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: rundownStartsWithBlock.block.id,
      groupColour: 'red',
    });
    expect(process(rundownStartsWithBlock['2'])).toStrictEqual({
      previousEvent: rundownStartsWithBlock['1'],
      latestEvent: rundownStartsWithBlock['2'],
      previousEntryId: rundownStartsWithBlock['1'].id,
      thisId: rundownStartsWithBlock['2'].id,
      eventIndex: 2,
      isPast: false,
      isNextDay: false,
      totalGap: 0,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: rundownStartsWithBlock.block.id,
      groupColour: 'red',
    });
  });
});

describe('makeSortableList()', () => {
  it('generates a list with block ends', () => {
    const order = ['block-1', '2', 'block-3', 'block-4'];
    const entries: RundownEntries = {
      'block-1': { type: SupportedEntry.Block, id: 'block-1', events: ['11'] } as OntimeBlock,
      '11': { type: SupportedEntry.Event, id: '11', parent: 'block-1' } as OntimeEvent,
      '2': { type: SupportedEntry.Event, id: '2', parent: null } as OntimeEvent,
      'block-3': { type: SupportedEntry.Block, id: 'block-3', events: ['31'] } as OntimeBlock,
      '31': { type: SupportedEntry.Event, id: '31', parent: 'block-3' } as OntimeEvent,
      'block-4': { type: SupportedEntry.Block, id: 'block-4', events: [] as string[] } as OntimeBlock,
    };

    const sortableList = makeSortableList(order, entries);
    expect(sortableList).toStrictEqual([
      'block-1',
      '11',
      'end-block-1',
      '2',
      'block-3',
      '31',
      'end-block-3',
      'block-4',
      'end-block-4',
    ]);
  });

  it('closes dangling blocks', () => {
    const order = ['block'];
    const entries: RundownEntries = {
      block: { type: SupportedEntry.Block, id: 'block-1', events: ['11', '12'] } as OntimeBlock,
      '11': { type: SupportedEntry.Event, id: '11', parent: 'block-1' } as OntimeEvent,
      '12': { type: SupportedEntry.Event, id: '12', parent: 'block-1' } as OntimeEvent,
    };

    const sortableList = makeSortableList(order, entries);
    expect(sortableList).toStrictEqual(['block-1', '11', '12', 'end-block-1']);
  });

  it('handles a list with a with just blocks', () => {
    const order = ['block-1', 'block-2'];
    const entries: RundownEntries = {
      'block-1': { type: SupportedEntry.Block, id: 'block-1', events: [] as string[] } as OntimeBlock,
      'block-2': { type: SupportedEntry.Block, id: 'block-2', events: [] as string[] } as OntimeBlock,
    };

    const sortableList = makeSortableList(order, entries);
    expect(sortableList).toStrictEqual(['block-1', 'end-block-1', 'block-2', 'end-block-2']);
  });
});

describe('moveUp()', () => {
  const sortableData = ['event1', 'event2', 'block1', 'event11', 'end-block1', 'block2', 'end-block2', 'event3'];
  const entries = {
    event1: { type: 'event', id: 'event1', parent: null } as OntimeEvent,
    event2: { type: 'event', id: 'event2', parent: null }as OntimeEvent,
    block1: { type: 'block', id: 'block1', events: ['event3'] } as OntimeBlock,
    event11: { type: 'event', id: 'event11', parent: 'block1' } as OntimeEvent,
    block2: { type: 'block', id: 'block2', events: [] as EntryId[] } as OntimeBlock,
    event3: { type: 'event', id: 'event3', parent: null } as OntimeEvent,
  };

  it('moves an event up in the list', () => {
    const result = moveUp('event2', sortableData, entries);
    expect(result).toStrictEqual({ destinationId: 'event1', order: 'before', isBlock: false });
  })

  it.todo('disallows nesting blocks', () => {
    const result = moveUp('block2', sortableData, entries);
    expect(result).toStrictEqual({ destinationId: 'block1', order: 'before', isBlock: false });
  })

  it('moves an event into a block', () => {
    const result = moveUp('event3', sortableData, entries);
    expect(result).toStrictEqual({ destinationId: 'block2', order: 'insert', isBlock: true });
  })

  it('moving up from top is noop', () => {
    const result = moveUp('event1', sortableData, entries);
    expect(result).toMatchObject({ destinationId: null });
  })
});

describe('moveDown()', () => {
  const sortableData = ['event1', 'event2', 'block1', 'event11', 'end-block1', 'block2', 'end-block2', 'event3'];
  const entries = {
    event1: { type: 'event', id: 'event1', parent: null } as OntimeEvent,
    event2: { type: 'event', id: 'event2', parent: null }as OntimeEvent,
    block1: { type: 'block', id: 'block1', events: ['event11'] } as OntimeBlock,
    event11: { type: 'event', id: 'event11', parent: 'block1' } as OntimeEvent,
    block2: { type: 'block', id: 'block2', events: [] as EntryId[] } as OntimeBlock,
    event3: { type: 'event', id: 'event3', parent: null } as OntimeEvent,
  };

  it('moves an event down in the list', () => {
    const result = moveDown('event1', sortableData, entries);
    expect(result).toStrictEqual({ destinationId: 'event2', order: 'after', isBlock: false });
  })

  it.todo('disallows nesting blocks', () => {
    const result = moveDown('block1', sortableData, entries);
    expect(result).toStrictEqual({ destinationId: 'block2', order: 'before', isBlock: false });
  })

  it('moves an event into a block', () => {
    const result = moveDown('event2', sortableData, entries);
    expect(result).toStrictEqual({ destinationId: 'event11', order: 'before', isBlock: true });
  })

  it('moving down from bottom is noop', () => {
    const result = moveDown('event3', sortableData, entries);
    expect(result).toMatchObject({ destinationId: null });
  })
});