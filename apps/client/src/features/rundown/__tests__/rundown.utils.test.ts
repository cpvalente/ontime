import { OntimeBlock, OntimeEvent, RundownEntries, SupportedEntry } from 'ontime-types';

import { makeRundownMetadata, makeSortableList } from '../rundown.utils';

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
        events: ['11', '12', '13'],
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

    expect(process(demoEvents['12'])).toMatchObject({
      previousEvent: demoEvents['11'],
      latestEvent: demoEvents['12'],
      previousEntryId: demoEvents['11'].id,
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
    const flatOrder = ['block-1', '11', '2', 'block-3', '31', 'block-4'];
    const entries: RundownEntries = {
      'block-1': { type: SupportedEntry.Block, id: 'block-1', events: ['11'] } as OntimeBlock,
      '11': { type: SupportedEntry.Event, id: '11', parent: 'block-1' } as OntimeEvent,
      '2': { type: SupportedEntry.Event, id: '2', parent: null } as OntimeEvent,
      'block-3': { type: SupportedEntry.Block, id: 'block-3', events: ['31'] } as OntimeBlock,
      '31': { type: SupportedEntry.Event, id: '31', parent: 'block-3' } as OntimeEvent,
      'block-4': { type: SupportedEntry.Block, id: 'block-4', events: [] as string[] } as OntimeBlock,
    };

    const sortableList = makeSortableList(flatOrder, entries);
    expect(sortableList).toEqual([
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
    const flatOrder = ['block', '11', '12'];
    const entries: RundownEntries = {
      block: { type: SupportedEntry.Block, id: 'block-1', events: ['11', '12'] } as OntimeBlock,
      '11': { type: SupportedEntry.Event, id: '11', parent: 'block-1' } as OntimeEvent,
      '12': { type: SupportedEntry.Event, id: '12', parent: 'block-1' } as OntimeEvent,
    };

    const sortableList = makeSortableList(flatOrder, entries);
    expect(sortableList).toStrictEqual(['block-1', '11', '12', 'end-block-1']);
  });

  it('handles a list with a with just blocks', () => {
    const flatOrder = ['block-1', 'block-2'];
    const entries: RundownEntries = {
      'block-1': { type: SupportedEntry.Block, id: 'block-1', events: [] as string[] } as OntimeBlock,
      'block-2': { type: SupportedEntry.Block, id: 'block-2', events: [] as string[] } as OntimeBlock,
    };

    const sortableList = makeSortableList(flatOrder, entries);
    expect(sortableList).toStrictEqual(['block-1', 'end-block-1', 'block-2', 'end-block-2']);
  });
});
