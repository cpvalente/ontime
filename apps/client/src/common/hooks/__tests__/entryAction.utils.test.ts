import { OntimeDelay, OntimeEntry, OntimeEvent, Rundown, SupportedEntry } from 'ontime-types';
import { createEvent, createGroup } from 'ontime-utils';

import { isStaleRundown, optimisticDeleteEntries, patchEntry } from '../entryAction.utils';

const makeEvent = (revision: number, patch: Partial<OntimeEvent> = {}) =>
  ({ id: 'event', type: SupportedEntry.Event, title: 'title', revision, ...patch }) as OntimeEvent;
const makeDelay = () => ({ id: 'delay', type: SupportedEntry.Delay, duration: 0 }) as OntimeDelay;

describe('patchEntry', () => {
  it('applies the patch and advances the revision, as the server does', () => {
    const patched = patchEntry(makeEvent(2), { title: 'new title' }) as OntimeEvent;
    expect(patched.title).toBe('new title');
    expect(patched.revision).toBe(3);
  });

  it('leaves delays without a revision', () => {
    const patched = patchEntry(makeDelay(), { duration: 10 }) as OntimeDelay;
    expect(patched.duration).toBe(10);
    expect('revision' in patched).toBe(false);
  });

  it('keeps the entry and its revision when the patch changes nothing, as the server does', () => {
    const entry = makeEvent(2);
    expect(patchEntry(entry, { id: 'event', title: 'title' })).toBe(entry);
  });

  it('merges custom fields, as the server does', () => {
    const patched = patchEntry(makeEvent(2, { custom: { a: 'a', b: 'b' } }), { custom: { b: 'new' } }) as OntimeEvent;
    expect(patched.custom).toEqual({ a: 'a', b: 'new' });
  });

  it('does not let a patch overwrite the revision it computes', () => {
    const patched = patchEntry(makeEvent(2), { revision: 99 } as Partial<OntimeEntry>) as OntimeEvent;
    expect(patched.revision).toBe(3);
  });
});

describe('isStaleRundown', () => {
  const cached = (revision: number) => ({ revision }) as Rundown;

  it('rejects a response which predates what we hold', () => {
    expect(isStaleRundown(cached(5), 4)).toBe(true);
  });

  it('accepts a response which matches or supersedes what we hold, or replaces an optimistic rundown', () => {
    expect(isStaleRundown(cached(5), 5)).toBe(false);
    expect(isStaleRundown(cached(-1), 3)).toBe(false);
    expect(isStaleRundown(undefined, 3)).toBe(false);
  });
});

describe('optimisticDeleteEntries', () => {
  // createEvent drops the parent, so we set it here
  const event = (id: string, parent: string | null = null): OntimeEvent => ({
    ...(createEvent({ id }) as OntimeEvent),
    parent,
  });

  // group holds a, b and c; d sits at the top level
  const makeRundown = (): Rundown => ({
    id: 'rundown',
    title: 'rundown',
    order: ['group', 'd'],
    flatOrder: ['group', 'a', 'b', 'c', 'd'],
    entries: {
      group: createGroup({ id: 'group', entries: ['a', 'b', 'c'] }),
      a: event('a', 'group'),
      b: event('b', 'group'),
      c: event('c', 'group'),
      d: event('d'),
    },
    revision: 1,
  });

  // the server edits the group once per removed child, advancing its revision each time
  it('removes children from their group, as the server does, without mutating the given rundown', () => {
    const rundown = makeRundown();
    const before = structuredClone(rundown);

    const result = optimisticDeleteEntries(['a', 'c'], rundown);

    expect(rundown).toStrictEqual(before);
    expect(result).toStrictEqual({
      entries: {
        group: { ...rundown.entries.group, entries: ['b'], revision: 2 },
        b: rundown.entries.b,
        d: rundown.entries.d,
      },
      order: ['group', 'd'],
      flatOrder: ['group', 'b', 'd'],
    });
  });

  it('removes a group together with its children', () => {
    const rundown = makeRundown();

    expect(optimisticDeleteEntries(['group'], rundown)).toStrictEqual({
      entries: { d: rundown.entries.d },
      order: ['d'],
      flatOrder: ['d'],
    });
  });

  it('ignores ids which are not in the rundown', () => {
    const rundown = makeRundown();
    const { entries, order, flatOrder } = rundown;

    expect(optimisticDeleteEntries(['missing'], rundown)).toStrictEqual({ entries, order, flatOrder });
  });
});
