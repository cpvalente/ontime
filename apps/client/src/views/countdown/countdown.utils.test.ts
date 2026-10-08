import {
  OffsetMode,
  OntimeEntry,
  OntimeEvent,
  OntimeGroup,
  OntimeReport,
  Playback,
  SupportedEntry,
} from 'ontime-types';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE } from 'ontime-utils';

import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import {
  CountdownTarget,
  extendEventData,
  getIsLive,
  getOrderedSubscriptions,
  groupSubscriptionTargets,
  isOutsideRange,
  makeSubscriptionsUrl,
  resolveSubscriptionTarget,
} from './countdown.utils';

/**
 * Minimal builders for the extended (metadata enriched) entries the countdown view consumes.
 * Only the fields exercised by resolveSubscriptionTarget are provided; the rest are cast away.
 */
function makeEvent(patch: Partial<ExtendedEntry<OntimeEvent>>): ExtendedEntry<OntimeEvent> {
  return {
    id: 'event',
    type: SupportedEntry.Event,
    title: 'event title',
    cue: '1',
    colour: '',
    skip: false,
    parent: null,
    timeStart: 0,
    timeEnd: 0,
    duration: 0,
    delay: 0,
    dayOffset: 0,
    gap: 0,
    countToEnd: false,
    custom: {},
    note: '',
    // metadata
    totalGap: 0,
    isLinkedToLoaded: false,
    isLoaded: false,
    isPast: false,
    ...patch,
  } as ExtendedEntry<OntimeEvent>;
}

function makeGroup(patch: Partial<ExtendedEntry<OntimeGroup>>): ExtendedEntry<OntimeGroup> {
  return {
    id: 'group',
    type: SupportedEntry.Group,
    title: 'group title',
    colour: '#abcdef',
    note: 'group note',
    entries: [],
    duration: 0,
    custom: {},
    timeStart: 0,
    timeEnd: 0,
    isPast: false,
    isLoaded: false,
    ...patch,
  } as ExtendedEntry<OntimeGroup>;
}

describe('resolveSubscriptionTarget()', () => {
  it('returns events unchanged', () => {
    const event = makeEvent({ id: 'e1' });
    const result = resolveSubscriptionTarget(event, [event]);
    expect(result).toBe(event);
  });

  it('derives group timing from the first playable child while keeping the group identity', () => {
    const group = makeGroup({ id: 'g1', title: 'Session A', colour: '#123456', duration: 5000 });
    const child1 = makeEvent({ id: 'c1', parent: 'g1', timeStart: 1000, delay: 100, dayOffset: 0, title: 'Pres 1' });
    const child2 = makeEvent({ id: 'c2', parent: 'g1', timeStart: 3000, title: 'Pres 2' });
    const flat: ExtendedEntry<OntimeEntry>[] = [group, child1, child2];

    const result = resolveSubscriptionTarget(group, flat);

    expect(result).not.toBeNull();
    // group identity and display
    expect(result?.id).toBe('g1');
    expect(result?.title).toBe('Session A');
    expect(result?.colour).toBe('#123456');
    expect(result?.isGroup).toBe(true);
    // timing comes from the first child, duration from the group
    expect(result?.timeStart).toBe(1000);
    expect(result?.delay).toBe(100);
    expect(result?.duration).toBe(5000);
    expect(result?.countToEnd).toBe(false);
    // state checks target the first child before any child is loaded
    expect(result?.targetId).toBe('c1');
    // report lookup targets the last child (session end)
    expect(result?.reportId).toBe('c2');
  });

  it('returns null for a group with no playable children', () => {
    const group = makeGroup({ id: 'g1' });
    const result = resolveSubscriptionTarget(group, [group]);
    expect(result).toBeNull();
  });

  it('skips skipped children when picking the first child', () => {
    const group = makeGroup({ id: 'g1' });
    const skipped = {
      ...makeEvent({ id: 'c0', parent: 'g1', timeStart: 500 }),
      skip: true,
    } as ExtendedEntry<OntimeEntry>;
    const playable = makeEvent({ id: 'c1', parent: 'g1', timeStart: 1500 });
    const result = resolveSubscriptionTarget(group, [group, skipped, playable]);
    expect(result?.timeStart).toBe(1500);
    expect(result?.reportId).toBe('c1');
  });

  it('is live while any child is loaded and not past', () => {
    const group = makeGroup({ id: 'g1' });
    const child1 = makeEvent({ id: 'c1', parent: 'g1', isPast: true });
    const child2 = makeEvent({ id: 'c2', parent: 'g1', isLoaded: true });
    const child3 = makeEvent({ id: 'c3', parent: 'g1' });
    const result = resolveSubscriptionTarget(group, [group, child1, child2, child3]);

    expect(result?.isLoaded).toBe(true);
    expect(result?.isPast).toBe(false);
    expect(result?.liveEntry?.id).toBe('c2');
  });

  it('is past only once the last child is past and nothing is loaded', () => {
    const group = makeGroup({ id: 'g1' });
    const child1 = makeEvent({ id: 'c1', parent: 'g1', isPast: true });
    const child2 = makeEvent({ id: 'c2', parent: 'g1', isPast: true });
    const result = resolveSubscriptionTarget(group, [group, child1, child2]);

    expect(result?.isLoaded).toBe(false);
    expect(result?.isPast).toBe(true);
    expect(result?.targetId).toBe('c1');
    expect(result?.liveEntry).toBeNull();
  });
});

describe('groupSubscriptionTargets()', () => {
  /**
   * Resolves a group the same way the view does, so that the tests exercise the real target shape
   * (a resolved group carries type Event, so the helper cannot rely on the entry type)
   */
  function resolveGroup(group: ExtendedEntry<OntimeGroup>, flat: ExtendedEntry<OntimeEntry>[]): CountdownTarget {
    const resolved = resolveSubscriptionTarget(group, flat);
    if (resolved === null) {
      throw new Error('test setup: group has no playable children');
    }
    return resolved;
  }

  it('returns no sections for an empty subscription list', () => {
    expect(groupSubscriptionTargets([])).toEqual([]);
  });

  it('gives each ungrouped event its own section', () => {
    const e1 = makeEvent({ id: 'e1' });
    const e2 = makeEvent({ id: 'e2' });

    expect(groupSubscriptionTargets([e1, e2])).toEqual([
      { group: null, events: [e1] },
      { group: null, events: [e2] },
    ]);
  });

  it('absorbs the children of a subscribed group into its section', () => {
    const group = makeGroup({ id: 'g1' });
    const c1 = makeEvent({ id: 'c1', parent: 'g1' });
    const c2 = makeEvent({ id: 'c2', parent: 'g1' });
    const resolved = resolveGroup(group, [group, c1, c2]);

    expect(groupSubscriptionTargets([resolved, c1, c2])).toEqual([{ group: resolved, events: [c1, c2] }]);
  });

  it('keeps a subscribed group with no subscribed children as an empty section', () => {
    const group = makeGroup({ id: 'g1' });
    const c1 = makeEvent({ id: 'c1', parent: 'g1' });
    const resolved = resolveGroup(group, [group, c1]);

    expect(groupSubscriptionTargets([resolved])).toEqual([{ group: resolved, events: [] }]);
  });

  it('does not absorb an event which belongs to a different group', () => {
    const group1 = makeGroup({ id: 'g1' });
    const c1 = makeEvent({ id: 'c1', parent: 'g1' });
    const group2 = makeGroup({ id: 'g2' });
    const c2 = makeEvent({ id: 'c2', parent: 'g2' });
    const flat = [group1, c1, group2, c2];
    const resolved1 = resolveGroup(group1, flat);
    const resolved2 = resolveGroup(group2, flat);

    expect(groupSubscriptionTargets([resolved1, c1, resolved2, c2])).toEqual([
      { group: resolved1, events: [c1] },
      { group: resolved2, events: [c2] },
    ]);
  });

  it('does not absorb an event whose parent group is not subscribed', () => {
    const group1 = makeGroup({ id: 'g1' });
    const c1 = makeEvent({ id: 'c1', parent: 'g1' });
    const group2 = makeGroup({ id: 'g2' });
    const c2 = makeEvent({ id: 'c2', parent: 'g2' });
    const resolved1 = resolveGroup(group1, [group1, c1, group2, c2]);

    // only the first group is subscribed, so the second group's child stands alone
    expect(groupSubscriptionTargets([resolved1, c1, c2])).toEqual([
      { group: resolved1, events: [c1] },
      { group: null, events: [c2] },
    ]);
  });

  it('closes a section when an ungrouped event follows a group', () => {
    const group = makeGroup({ id: 'g1' });
    const c1 = makeEvent({ id: 'c1', parent: 'g1' });
    const e1 = makeEvent({ id: 'e1' });
    const resolved = resolveGroup(group, [group, c1]);

    expect(groupSubscriptionTargets([resolved, c1, e1])).toEqual([
      { group: resolved, events: [c1] },
      { group: null, events: [e1] },
    ]);
  });
});

describe('getIsLive()', () => {
  it('is live when the entry is the loaded one and playback has started', () => {
    expect(getIsLive('a', 'a', Playback.Play)).toBe(true);
    expect(getIsLive('a', 'a', Playback.Pause)).toBe(true);
  });

  it('is not live when the entry is only armed, or is not the loaded one', () => {
    expect(getIsLive('a', 'a', Playback.Armed)).toBe(false);
    expect(getIsLive('a', 'b', Playback.Play)).toBe(false);
    expect(getIsLive('a', null, Playback.Play)).toBe(false);
  });
});

describe('makeSubscriptionsUrl()', () => {
  it('adds each subscription as a sub parameter', () => {
    const url = makeSubscriptionsUrl('http://localhost:4001/countdown', ['a', 'b']);
    expect(url.searchParams.getAll('sub')).toStrictEqual(['a', 'b']);
  });

  it('replaces previous subscriptions and keeps the other view settings', () => {
    const url = makeSubscriptionsUrl('http://localhost:4001/countdown?sub=old&hideClock=true&sub=older', ['new']);
    expect(url.searchParams.getAll('sub')).toStrictEqual(['new']);
    expect(url.searchParams.get('hideClock')).toBe('true');
  });

  it('removes all subscriptions when given none', () => {
    const url = makeSubscriptionsUrl('http://localhost:4001/countdown?sub=old', []);
    expect(url.searchParams.has('sub')).toBe(false);
  });
});

describe('getOrderedSubscriptions()', () => {
  it('keeps the rundown order, regardless of the order of subscription', () => {
    const rundown = [makeEvent({ id: 'a' }), makeEvent({ id: 'b' }), makeEvent({ id: 'c' })];
    expect(getOrderedSubscriptions(['c', 'a'], rundown).map((event) => event.id)).toStrictEqual(['a', 'c']);
  });

  it('ignores subscriptions to entries which are no longer in the rundown', () => {
    const rundown = [makeEvent({ id: 'a' })];
    expect(getOrderedSubscriptions(['deleted', 'a'], rundown).map((event) => event.id)).toStrictEqual(['a']);
  });
});

describe('isOutsideRange()', () => {
  it('tolerates a difference of up to a minute', () => {
    expect(isOutsideRange(0, MILLIS_PER_MINUTE)).toBe(false);
    expect(isOutsideRange(MILLIS_PER_MINUTE, 0)).toBe(false);
  });

  it('flags differences larger than a minute in either direction', () => {
    expect(isOutsideRange(0, MILLIS_PER_MINUTE + 1)).toBe(true);
    expect(isOutsideRange(MILLIS_PER_MINUTE + 1, 0)).toBe(true);
  });
});

describe('extendEventData()', () => {
  const start = 10 * MILLIS_PER_HOUR;
  const hour = MILLIS_PER_HOUR;
  const report: OntimeReport = {
    a: {
      startedAt: start,
      startedAtDay: 0,
      endedAt: 10.5 * hour,
      endedAtDay: 0,
      scheduledStart: start,
      scheduledDay: 0,
      scheduledDuration: hour,
    },
    last: {
      startedAt: 11 * hour,
      startedAtDay: 0,
      endedAt: 12 * hour,
      endedAtDay: 0,
      scheduledStart: 11 * hour,
      scheduledDay: 0,
      scheduledDuration: hour,
    },
  };
  const extend = (event: CountdownTarget) => extendEventData(event, 0, null, null, 0, OffsetMode.Absolute, report);

  it('reports when the event ended, according to the report', () => {
    const event = makeEvent({ id: 'a', timeStart: start, timeEnd: start + hour, duration: hour });
    expect(extend(event).endedAt).toBe(10.5 * hour);
  });

  it('has no end time for events which have not run', () => {
    const event = makeEvent({ id: 'never-played', timeStart: start, timeEnd: start + hour, duration: hour });
    expect(extend(event).endedAt).toBeNull();
  });

  it('reports a group as ended when its last child ended', () => {
    const group = { ...makeEvent({ id: 'group', timeStart: start, duration: hour }), isGroup: true, reportId: 'last' };
    expect(extend(group).endedAt).toBe(12 * hour);
  });

  it('expects an event on time to start and end as scheduled', () => {
    const event = makeEvent({ id: 'a', timeStart: start, timeEnd: start + hour, duration: hour });
    expect(extend(event)).toMatchObject({ expectedStart: start, expectedEnd: start + hour });
  });
});
