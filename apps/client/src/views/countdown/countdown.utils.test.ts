import { OntimeEntry, OntimeEvent, OntimeGroup, SupportedEntry } from 'ontime-types';

import { ExtendedEntry } from '../../common/utils/rundownMetadata';
import { CountdownTarget, groupSubscriptionTargets, resolveSubscriptionTarget } from './countdown.utils';

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
