import type { EntryId, OntimeEntry, OntimeEvent, OntimeGroup } from 'ontime-types';
import { SupportedEntry } from 'ontime-types';

import { getRemainingGroupTime } from '../groupTimer';

function makeEvent(id: EntryId, patch: Partial<OntimeEvent> = {}): OntimeEvent {
  return {
    id,
    type: SupportedEntry.Event,
    duration: 0,
    gap: 0,
    skip: false,
    parent: 'group',
    ...patch,
  } as OntimeEvent;
}

function makeGroup(entries: EntryId[]): OntimeGroup {
  return { id: 'group', type: SupportedEntry.Group, entries } as OntimeGroup;
}

function makeEntries(...entries: OntimeEntry[]): Record<EntryId, OntimeEntry> {
  return Object.fromEntries(entries.map((entry) => [entry.id, entry]));
}

describe('getRemainingGroupTime()', () => {
  it('sums the duration of the events after the current one', () => {
    const group = makeGroup(['1', '2', '3']);
    const entries = makeEntries(
      makeEvent('1', { duration: 10 }),
      makeEvent('2', { duration: 20 }),
      makeEvent('3', { duration: 30 }),
    );

    expect(getRemainingGroupTime(group, entries, '1')).toBe(50);
    expect(getRemainingGroupTime(group, entries, '2')).toBe(30);
  });

  it('accounts for the gaps between events', () => {
    const group = makeGroup(['1', '2', '3']);
    const entries = makeEntries(
      makeEvent('1', { duration: 10 }),
      makeEvent('2', { duration: 20, gap: 5 }),
      makeEvent('3', { duration: 30, gap: 7 }),
    );

    expect(getRemainingGroupTime(group, entries, '1')).toBe(20 + 5 + 30 + 7);
  });

  it('adds up to the group duration when the first event is loaded', () => {
    // mirrors the aggregation the server uses to calculate group.duration
    const group = makeGroup(['1', '2', '3']);
    const first = makeEvent('1', { duration: 10 });
    const entries = makeEntries(first, makeEvent('2', { duration: 20, gap: 5 }), makeEvent('3', { duration: 30 }));

    const groupDuration = 10 + 20 + 5 + 30;
    expect(first.duration + getRemainingGroupTime(group, entries, '1')).toBe(groupDuration);
  });

  it('returns 0 on the last event of the group', () => {
    const group = makeGroup(['1', '2']);
    const entries = makeEntries(makeEvent('1', { duration: 10 }), makeEvent('2', { duration: 20 }));

    expect(getRemainingGroupTime(group, entries, '2')).toBe(0);
  });

  it('skips entries which are not playable events', () => {
    const group = makeGroup(['1', '2', '3', '4']);
    const entries = makeEntries(
      makeEvent('1', { duration: 10 }),
      makeEvent('2', { duration: 20, skip: true }),
      { id: '3', type: SupportedEntry.Milestone, parent: 'group' } as OntimeEntry,
      makeEvent('4', { duration: 40 }),
    );

    expect(getRemainingGroupTime(group, entries, '1')).toBe(40);
  });

  it('returns 0 when the loaded event is not part of the group', () => {
    const group = makeGroup(['1', '2']);
    const entries = makeEntries(makeEvent('1', { duration: 10 }), makeEvent('2', { duration: 20 }));

    expect(getRemainingGroupTime(group, entries, 'elsewhere')).toBe(0);
    expect(getRemainingGroupTime(group, entries, null)).toBe(0);
  });

  it('tolerates ids which are missing from the rundown', () => {
    const group = makeGroup(['1', 'missing', '3']);
    const entries = makeEntries(makeEvent('1', { duration: 10 }), makeEvent('3', { duration: 30 }));

    expect(getRemainingGroupTime(group, entries, '1')).toBe(30);
  });
});
