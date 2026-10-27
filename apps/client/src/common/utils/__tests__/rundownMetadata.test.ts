import { OntimeDelay, OntimeEntry, OntimeEvent, OntimeGroup, OntimeMilestone, SupportedEntry } from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { getRundownMetadata, initRundownMetadata } from '../rundownMetadata';

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
      isFirstAfterGroup: false,
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
      isFirstAfterGroup: false,
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
      isFirstAfterGroup: false,
    });

    expect(process(demoEvents['11'])).toMatchObject({
      previousEvent: demoEvents['1'],
      latestEvent: demoEvents['11'],
      previousEntryId: demoEvents['group'].id,
      thisId: demoEvents['11'].id,
      eventIndex: 2,
      isPast: true,
      isNextDay: false,
      totalGap: 0,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: 'group',
      groupColour: 'red',
      isFirstAfterGroup: false,
    });

    expect(process(demoEvents['delay'])).toMatchObject({
      previousEvent: demoEvents['11'],
      latestEvent: demoEvents['11'],
      previousEntryId: demoEvents['11'].id,
      thisId: demoEvents['delay'].id,
      eventIndex: 2,
      isPast: true,
      isNextDay: false,
      totalGap: 0,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: 'group',
      groupColour: 'red',
      isFirstAfterGroup: false,
    });

    expect(process(demoEvents['12'])).toMatchObject({
      previousEvent: demoEvents['11'],
      latestEvent: demoEvents['12'],
      previousEntryId: demoEvents['delay'].id,
      thisId: demoEvents['12'].id,
      eventIndex: 3,
      isPast: false,
      isNextDay: false,
      totalGap: 0,
      isLinkedToLoaded: true,
      isLoaded: true,
      groupId: 'group',
      groupColour: 'red',
      isFirstAfterGroup: false,
    });

    expect(process(demoEvents['13'])).toMatchObject({
      previousEvent: demoEvents['12'],
      latestEvent: demoEvents['13'],
      previousEntryId: demoEvents['12'].id,
      thisId: demoEvents['13'].id,
      eventIndex: 4,
      isPast: false,
      isNextDay: false,
      totalGap: 0,
      isLinkedToLoaded: true,
      isLoaded: false,
      groupId: 'group',
      groupColour: 'red',
      isFirstAfterGroup: false,
    });

    expect(process(demoEvents['2'])).toMatchObject({
      previousEvent: demoEvents['13'],
      latestEvent: demoEvents['2'],
      previousEntryId: demoEvents['13'].id,
      thisId: demoEvents['2'].id,
      eventIndex: 5,
      isPast: false,
      isNextDay: false,
      totalGap: 7,
      isLinkedToLoaded: false,
      isLoaded: false,
      groupId: null,
      groupColour: undefined,
      isFirstAfterGroup: true,
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
      isFirstAfterGroup: false,
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
      isFirstAfterGroup: false,
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
      isFirstAfterGroup: false,
    });
  });
});

describe('getRundownMetadata() gap and link to loaded', () => {
  function event(id: string, patch: Partial<OntimeEvent> = {}): OntimeEvent {
    return {
      id,
      type: SupportedEntry.Event,
      parent: null,
      timeStart: 0,
      duration: 10,
      dayOffset: 0,
      gap: 0,
      skip: false,
      linkStart: false,
      countToEnd: false,
      ...patch,
    } as OntimeEvent;
  }

  function linkState(entries: Record<string, OntimeEntry>, flatOrder: string[], loadedId: string | null) {
    const metadata = getRundownMetadata({ entries, flatOrder }, loadedId);
    return Object.fromEntries(
      flatOrder.map((id) => {
        const { isPast, isLoaded, totalGap, isLinkedToLoaded } = metadata[id];
        return [id, { isPast, isLoaded, totalGap, isLinkedToLoaded }];
      }),
    );
  }

  it('carries the chain through skipped events, delays, milestones and groups', () => {
    const entries = {
      before: event('before', { timeStart: 0 }),
      loaded: event('loaded', { timeStart: 10 }),
      skipped: event('skipped', { timeStart: 20, skip: true, gap: 50 }),
      group: { id: 'group', type: SupportedEntry.Group, entries: ['a', 'delay', 'b'] } as unknown as OntimeGroup,
      a: event('a', { parent: 'group', timeStart: 20, linkStart: true }),
      delay: { id: 'delay', type: SupportedEntry.Delay, parent: 'group', duration: 0 } as OntimeDelay,
      b: event('b', { parent: 'group', timeStart: 30, linkStart: true }),
      milestone: { id: 'milestone', type: SupportedEntry.Milestone, parent: null } as OntimeMilestone,
      c: event('c', { timeStart: 45, gap: 5 }),
      d: event('d', { timeStart: 58, gap: 3, linkStart: true }),
    };
    const flatOrder = ['before', 'loaded', 'skipped', 'group', 'a', 'delay', 'b', 'milestone', 'c', 'd'];

    expect(linkState(entries, flatOrder, 'loaded')).toStrictEqual({
      before: { isPast: true, isLoaded: false, totalGap: 0, isLinkedToLoaded: false },
      loaded: { isPast: false, isLoaded: true, totalGap: 0, isLinkedToLoaded: true },
      skipped: { isPast: false, isLoaded: false, totalGap: 0, isLinkedToLoaded: true },
      group: { isPast: false, isLoaded: false, totalGap: 0, isLinkedToLoaded: true },
      a: { isPast: false, isLoaded: false, totalGap: 0, isLinkedToLoaded: true },
      delay: { isPast: false, isLoaded: false, totalGap: 0, isLinkedToLoaded: true },
      b: { isPast: false, isLoaded: false, totalGap: 0, isLinkedToLoaded: true },
      milestone: { isPast: false, isLoaded: false, totalGap: 0, isLinkedToLoaded: true },
      c: { isPast: false, isLoaded: false, totalGap: 5, isLinkedToLoaded: false },
      d: { isPast: false, isLoaded: false, totalGap: 8, isLinkedToLoaded: false },
    });
  });

  it('breaks the chain after a countToEnd event without adding its duration to the gap', () => {
    const entries = {
      loaded: event('loaded', { timeStart: 0 }),
      cte: event('cte', { timeStart: 10, linkStart: true, countToEnd: true }),
      next: event('next', { timeStart: 20, linkStart: true }),
      later: event('later', { timeStart: 35, gap: 5, linkStart: true }),
    };
    const flatOrder = ['loaded', 'cte', 'next', 'later'];

    expect(linkState(entries, flatOrder, 'loaded')).toMatchObject({
      cte: { totalGap: 0, isLinkedToLoaded: true },
      next: { totalGap: 0, isLinkedToLoaded: false },
      later: { totalGap: 5, isLinkedToLoaded: false },
    });
  });

  it('breaks the chain after a loaded countToEnd event', () => {
    const entries = {
      loaded: event('loaded', { timeStart: 0, countToEnd: true }),
      next: event('next', { timeStart: 10, linkStart: true }),
    };

    expect(linkState(entries, ['loaded', 'next'], 'loaded')).toMatchObject({
      next: { totalGap: 0, isLinkedToLoaded: false },
    });
  });

  it('follows the chain across midnight and checks countToEnd on the latest event rather than the previous', () => {
    const entries = {
      loaded: event('loaded', { timeStart: 22 * MILLIS_PER_HOUR, duration: 3 * MILLIS_PER_HOUR }),
      // ends before the loaded event, so it is not the latest event
      overlap: event('overlap', {
        timeStart: 23 * MILLIS_PER_HOUR,
        duration: MILLIS_PER_HOUR / 2,
        linkStart: true,
        countToEnd: true,
      }),
      nextDay: event('nextDay', { timeStart: MILLIS_PER_HOUR, dayOffset: 1, linkStart: true }),
      gapped: event('gapped', { timeStart: 5 * MILLIS_PER_HOUR, dayOffset: 1, gap: 2 * MILLIS_PER_HOUR }),
    };
    const flatOrder = ['loaded', 'overlap', 'nextDay', 'gapped'];

    expect(linkState(entries, flatOrder, 'loaded')).toMatchObject({
      overlap: { totalGap: 0, isLinkedToLoaded: true },
      nextDay: { totalGap: 0, isLinkedToLoaded: true },
      gapped: { totalGap: 2 * MILLIS_PER_HOUR, isLinkedToLoaded: false },
    });
  });

  it('accumulates every gap and links nothing when no event is loaded', () => {
    const entries = {
      a: event('a', { timeStart: 0 }),
      b: event('b', { timeStart: 15, gap: 5, linkStart: true }),
      c: event('c', { timeStart: 30, gap: 5 }),
    };

    expect(linkState(entries, ['a', 'b', 'c'], null)).toStrictEqual({
      a: { isPast: false, isLoaded: false, totalGap: 0, isLinkedToLoaded: false },
      b: { isPast: false, isLoaded: false, totalGap: 5, isLinkedToLoaded: false },
      c: { isPast: false, isLoaded: false, totalGap: 10, isLinkedToLoaded: false },
    });
  });

  it('walks downstream of a loaded event which is skipped', () => {
    const entries = {
      loaded: event('loaded', { timeStart: 0, skip: true }),
      next: event('next', { timeStart: 15, gap: 5, linkStart: true }),
    };

    expect(linkState(entries, ['loaded', 'next'], 'loaded')).toStrictEqual({
      loaded: { isPast: false, isLoaded: true, totalGap: 0, isLinkedToLoaded: true },
      next: { isPast: false, isLoaded: false, totalGap: 5, isLinkedToLoaded: true },
    });
  });
});
