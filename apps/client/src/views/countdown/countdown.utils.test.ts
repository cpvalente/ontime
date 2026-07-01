import { OntimeEntry, OntimeEvent, OntimeGroup, SupportedEntry } from 'ontime-types';

import { ExtendedEntry } from '../../common/utils/rundownMetadata';

import { resolveSubscriptionTarget } from './countdown.utils';

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
    const skipped = { ...makeEvent({ id: 'c0', parent: 'g1', timeStart: 500 }), skip: true } as ExtendedEntry<OntimeEntry>;
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
    expect(result?.liveEntry).toBeNull();
  });
});
