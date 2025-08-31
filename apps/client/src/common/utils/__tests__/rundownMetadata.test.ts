import { OntimeDelay, OntimeEvent, OntimeGroup, SupportedEntry } from 'ontime-types';

import { initRundownMetadata } from '../rundownMetadata';

describe('initRundownMetadata()', () => {
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

    const { metadata, process } = initRundownMetadata(selectedEventId);

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
    const { process } = initRundownMetadata(null);

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
