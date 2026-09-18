import { OntimeEntry, Rundown, SupportedEntry } from 'ontime-types';

import { flattenRundown } from '../useRundownById';

const entry = (id: string) => ({ id, type: SupportedEntry.Event, revision: 0 }) as OntimeEntry;

describe('flattenRundown', () => {
  it('resolves the flat order into entries', () => {
    const rundown = { entries: { a: entry('a'), b: entry('b') }, flatOrder: ['a', 'b'] } as unknown as Rundown;
    expect(flattenRundown(rundown).map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('flattens an empty rundown to nothing', () => {
    expect(flattenRundown({ entries: {}, flatOrder: [] })).toEqual([]);
  });

  it('skips ids which have no entry', () => {
    const rundown = { entries: { a: entry('a') }, flatOrder: ['a', 'missing'] } as unknown as Rundown;
    expect(flattenRundown(rundown).map((e) => e.id)).toEqual(['a']);
  });

  it('flattens an optimistic rundown, which carries revision -1', () => {
    const optimistic = { entries: { a: entry('a') }, flatOrder: ['a'], revision: -1 } as unknown as Rundown;
    expect(flattenRundown(optimistic).map((e) => e.id)).toEqual(['a']);
  });
});
