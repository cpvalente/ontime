import { EntryId, OntimeDelay, OntimeEvent, OntimeGroup, RundownEntries, SupportedEntry } from 'ontime-types';

import { makeRundownMetadata, makeSortableList, moveDown, moveUp, orderEntries } from '../rundown.utils';

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
      group: {
        id: 'group',
        type: SupportedEntry.Group,
        entries: ['11', 'delay', '12', '13'],
        colour: 'red',
      } as OntimeGroup,
      '11': {
        id: '11',
        type: SupportedEntry.Event,
        parent: 'group',
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
        parent: 'group',
        duration: 0,
      } as OntimeDelay,
      '12': {
        id: '12',
        type: SupportedEntry.Event,
        parent: 'group',
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
        parent: 'group',
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
      groupEntries: undefined,
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
      groupEntries: undefined,
    });

    expect(process(demoEvents['group'])).toMatchObject({
      previousEvent: demoEvents['1'],
      latestEvent: demoEvents['1'],
      previousEntryId: demoEvents['1'].id,
      thisId: demoEvents['group'].id,
      eventIndex: 1,
      isPast: true,
      isNextDay: false,
      totalGap: 0,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: 'group',
      groupColour: 'red',
    });

    expect(process(demoEvents['11'])).toMatchObject({
      previousEvent: demoEvents['1'],
      latestEvent: demoEvents['11'],
      previousEntryId: demoEvents['group'].id,
      thisId: demoEvents['11'].id,
      eventIndex: 2,
      isPast: true,
      isNextDay: false,
      totalGap: 10,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: 'group',
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
      groupId: 'group',
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
      groupId: 'group',
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
      groupId: 'group',
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

  it('populates previousEntries in groups', () => {
    const rundownStartsWithGroup = {
      group: {
        id: 'group',
        type: SupportedEntry.Group,
        colour: 'red',
        entries: ['1', '2'],
      } as OntimeGroup,
      '1': {
        id: '1',
        type: SupportedEntry.Event,
        parent: 'group',
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
        parent: 'group',
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

    expect(process(rundownStartsWithGroup.group)).toStrictEqual({
      previousEvent: null,
      latestEvent: null,
      previousEntryId: null,
      thisId: rundownStartsWithGroup.group.id,
      eventIndex: 0,
      isPast: false,
      isNextDay: false,
      totalGap: 0,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: rundownStartsWithGroup.group.id,
      groupColour: 'red',
      groupEntries: 2,
    });

    expect(process(rundownStartsWithGroup['1'])).toStrictEqual({
      previousEvent: null,
      latestEvent: rundownStartsWithGroup['1'],
      previousEntryId: rundownStartsWithGroup.group.id,
      thisId: rundownStartsWithGroup['1'].id,
      eventIndex: 1,
      isPast: false,
      isNextDay: false,
      totalGap: 0,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: rundownStartsWithGroup.group.id,
      groupColour: 'red',
      groupEntries: 2,
    });
    expect(process(rundownStartsWithGroup['2'])).toStrictEqual({
      previousEvent: rundownStartsWithGroup['1'],
      latestEvent: rundownStartsWithGroup['2'],
      previousEntryId: rundownStartsWithGroup['1'].id,
      thisId: rundownStartsWithGroup['2'].id,
      eventIndex: 2,
      isPast: false,
      isNextDay: false,
      totalGap: 0,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: rundownStartsWithGroup.group.id,
      groupColour: 'red',
      groupEntries: 2,
    });
  });
});

describe('makeSortableList()', () => {
  it('generates a list with group ends', () => {
    const order = ['group-1', '2', 'group-3', 'group-4'];
    const entries: RundownEntries = {
      'group-1': { type: SupportedEntry.Group, id: 'group-1', entries: ['11'] } as OntimeGroup,
      '11': { type: SupportedEntry.Event, id: '11', parent: 'group-1' } as OntimeEvent,
      '2': { type: SupportedEntry.Event, id: '2', parent: null } as OntimeEvent,
      'group-3': { type: SupportedEntry.Group, id: 'group-3', entries: ['31'] } as OntimeGroup,
      '31': { type: SupportedEntry.Event, id: '31', parent: 'group-3' } as OntimeEvent,
      'group-4': { type: SupportedEntry.Group, id: 'group-4', entries: [] as string[] } as OntimeGroup,
    };

    const sortableList = makeSortableList(order, entries);
    expect(sortableList).toStrictEqual([
      'group-1',
      '11',
      'end-group-1',
      '2',
      'group-3',
      '31',
      'end-group-3',
      'group-4',
      'end-group-4',
    ]);
  });

  it('closes dangling group', () => {
    const order = ['group'];
    const entries: RundownEntries = {
      group: { type: SupportedEntry.Group, id: 'group-1', entries: ['11', '12'] } as OntimeGroup,
      '11': { type: SupportedEntry.Event, id: '11', parent: 'group-1' } as OntimeEvent,
      '12': { type: SupportedEntry.Event, id: '12', parent: 'group-1' } as OntimeEvent,
    };

    const sortableList = makeSortableList(order, entries);
    expect(sortableList).toStrictEqual(['group-1', '11', '12', 'end-group-1']);
  });

  it('handles a list with a with just groups', () => {
    const order = ['group-1', 'group-2'];
    const entries: RundownEntries = {
      'group-1': { type: SupportedEntry.Group, id: 'group-1', entries: [] as string[] } as OntimeGroup,
      'group-2': { type: SupportedEntry.Group, id: 'group-2', entries: [] as string[] } as OntimeGroup,
    };

    const sortableList = makeSortableList(order, entries);
    expect(sortableList).toStrictEqual(['group-1', 'end-group-1', 'group-2', 'end-group-2']);
  });
});

describe('moveUp()', () => {
  const rundown = {
    entries: {
      '1': { id: '1', type: 'event', parent: null } as OntimeEvent,
      '2': { id: '2', type: 'event', parent: null } as OntimeEvent,
      '3': { id: '3', type: 'event', parent: null } as OntimeEvent,
      group: { id: 'group', type: 'group', entries: ['11', '12'] } as OntimeGroup,
      '11': { id: '11', type: 'event', parent: 'group' } as OntimeEvent,
      '12': { id: '12', type: 'event', parent: 'group' } as OntimeEvent,
      '4': { id: '4', type: 'event', parent: null } as OntimeEvent,
      group2: { id: 'group2', type: 'group', entries: [] as EntryId[] } as OntimeGroup,
      '5': { id: '5', type: 'event', parent: null } as OntimeEvent,
    },
    order: ['1', '2', '3', 'group', '4', 'group2', '5'],
    flatOrder: ['1', '2', '3', 'group', '11', '12', '4', 'group2', '5'],
  };

  it('moving the first event is a noop', () => {
    expect(moveUp('1', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: null,
      order: 'before',
    });
  });

  it('moves an entry up in the rundown', () => {
    expect(moveUp('2', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: '1',
      order: 'before',
    });
  });

  it('moves an entry up inside a group', () => {
    expect(moveUp('12', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: '11',
      order: 'before',
    });
  });

  it('moves an entry up into an empty group', () => {
    expect(moveUp('5', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: 'group2',
      order: 'insert',
    });
  });

  it('moves an entry up into a group', () => {
    expect(moveUp('4', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: '12',
      order: 'after',
    });
  });

  it('moves an entry up out of a group', () => {
    expect(moveUp('11', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: 'group',
      order: 'before',
    });
  });

  it('moves a group in the rundown', () => {
    expect(moveUp('group', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: '3',
      order: 'before',
    });
  });

  it('swaps two groups', () => {
    const rundown = {
      entries: {
        group: { id: 'group', type: 'group', entries: ['11'] } as OntimeGroup,
        '11': { id: '11', type: 'event', parent: 'group' } as OntimeEvent,
        group2: { id: 'group2', type: 'group', entries: [] as EntryId[] } as OntimeGroup,
      },
      order: ['group', 'group2'],
      flatOrder: ['group', '11', 'group2'],
    };
    expect(moveUp('group2', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: 'group',
      order: 'before',
    });
  });

  it('moves before a group', () => {
    const rundown = {
      entries: {
        group: { id: 'group', type: 'group', entries: ['11'] } as OntimeGroup,
        '11': { id: '11', type: 'event', parent: 'group' } as OntimeEvent,
      },
      order: ['group'],
      flatOrder: ['group', '11'],
    };
    expect(moveUp('11', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: 'group',
      order: 'before',
    });
  });
});

describe('moveDown()', () => {
  const rundown = {
    entries: {
      '1': { id: '1', type: 'event', parent: null } as OntimeEvent,
      '2': { id: '2', type: 'event', parent: null } as OntimeEvent,
      '3': { id: '3', type: 'event', parent: null } as OntimeEvent,
      group: { id: 'group', type: 'group', entries: ['11', '12'] } as OntimeGroup,
      '11': { id: '11', type: 'event', parent: 'group' } as OntimeEvent,
      '12': { id: '12', type: 'event', parent: 'group' } as OntimeEvent,
      '4': { id: '4', type: 'event', parent: null } as OntimeEvent,
      group2: { id: 'group2', type: 'group', entries: [] as EntryId[] } as OntimeGroup,
      '5': { id: '5', type: 'event', parent: null } as OntimeEvent,
    },
    order: ['1', '2', '3', 'group', '4', 'group2', '5'],
    flatOrder: ['1', '2', '3', 'group', '11', '12', '4', 'group2', '5'],
  };

  it('moving the last event is a noop', () => {
    expect(moveDown('5', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: null,
      order: 'after',
    });
  });

  it('moves an entry down in the rundown', () => {
    expect(moveDown('2', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: '3',
      order: 'after',
    });
  });

  it('moves an entry down inside a group', () => {
    expect(moveDown('11', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: '12',
      order: 'after',
    });
  });

  it('moves an entry down into an empty group', () => {
    expect(moveDown('4', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: 'group2',
      order: 'insert',
    });
  });

  it('moves an entry down out of a group', () => {
    expect(moveDown('12', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: 'group',
      order: 'after',
    });
  });

  it('moves an entry down into a group', () => {
    expect(moveDown('3', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: '11',
      order: 'before',
    });
  });

  it('moves a group in the rundown', () => {
    expect(moveDown('group', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: '4',
      order: 'after',
    });
  });

  it('swaps two groups', () => {
    const rundown = {
      entries: {
        group: { id: 'group', type: 'group', entries: ['11'] } as OntimeGroup,
        '11': { id: '11', type: 'event', parent: 'group' } as OntimeEvent,
        group2: { id: 'group2', type: 'group', entries: [] as EntryId[] } as OntimeGroup,
      },
      order: ['group', 'group2'],
      flatOrder: ['group', '11', 'group2'],
    };
    expect(moveDown('group', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: 'group2',
      order: 'after',
    });
  });

  it('moves after a group', () => {
    const rundown = {
      entries: {
        group: { id: 'group', type: 'group', entries: ['11'] } as OntimeGroup,
        '11': { id: '11', type: 'event', parent: 'group' } as OntimeEvent,
      },
      order: ['group'],
      flatOrder: ['group', '11'],
    };
    expect(moveDown('11', rundown.flatOrder, rundown.entries)).toStrictEqual({
      destinationId: 'group',
      order: 'after',
    });
  });
});

describe('orderEntries()', () => {
  it('should return an empty array when both inputs are empty', () => {
    const unorderedArray: string[] = [];
    const flatOrder: string[] = [];
    const result = orderEntries(unorderedArray, flatOrder);
    expect(result).toEqual([]);
  });

  it('should return an ordered array based on flatOrder', () => {
    const unorderedArray = ['b', 'a', 'c'];
    const flatOrder = ['a', 'b', 'c'];
    const result = orderEntries(unorderedArray, flatOrder);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should ignore elements in unorderedArray not present in flatOrder', () => {
    const unorderedArray = ['b', 'a', 'c', 'd'];
    const flatOrder = ['a', 'b', 'c'];
    const result = orderEntries(unorderedArray, flatOrder);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should handle cases where flatOrder has elements not in unorderedArray', () => {
    const unorderedArray = ['b', 'a'];
    const flatOrder = ['a', 'b', 'c'];
    const result = orderEntries(unorderedArray, flatOrder);
    expect(result).toEqual(['a', 'b']);
  });

  it('should return an empty array if unorderedArray has no matching elements in flatOrder', () => {
    const unorderedArray = ['x', 'y', 'z'];
    const flatOrder = ['a', 'b', 'c'];
    const result = orderEntries(unorderedArray, flatOrder);
    expect(result).toEqual([]);
  });
});
