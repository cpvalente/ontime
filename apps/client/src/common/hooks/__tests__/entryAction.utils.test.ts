import { OntimeDelay, OntimeEntry, OntimeEvent, OntimeGroup, SupportedEntry } from 'ontime-types';

import { entryRevision, isStaleEntry, patchEntry } from '../entryAction.utils';

const makeEvent = (revision: number, patch: Partial<OntimeEvent> = {}) =>
  ({ id: 'event', type: SupportedEntry.Event, title: 'title', revision, ...patch }) as OntimeEvent;
const makeGroup = (revision: number) =>
  ({ id: 'group', type: SupportedEntry.Group, title: 'group', revision }) as OntimeGroup;
const makeDelay = () => ({ id: 'delay', type: SupportedEntry.Delay, duration: 0 }) as OntimeDelay;

describe('entryRevision', () => {
  it('reads the revision of entries which carry one', () => {
    expect(entryRevision(makeEvent(3))).toBe(3);
    expect(entryRevision(makeGroup(5))).toBe(5);
  });

  it('reports no revision for delays and missing entries', () => {
    expect(entryRevision(makeDelay())).toBeNull();
    expect(entryRevision(undefined)).toBeNull();
  });
});

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

  it('does not let a patch overwrite the revision it computes', () => {
    const patched = patchEntry(makeEvent(2), { revision: 99 } as Partial<OntimeEntry>) as OntimeEvent;
    expect(patched.revision).toBe(3);
  });
});

describe('isStaleEntry', () => {
  it('rejects a response which predates what we hold', () => {
    expect(isStaleEntry(makeEvent(3), makeEvent(2))).toBe(true);
  });

  it('accepts a response which matches or supersedes what we hold', () => {
    expect(isStaleEntry(makeEvent(3), makeEvent(3))).toBe(false);
    expect(isStaleEntry(makeEvent(3), makeEvent(4))).toBe(false);
  });

  it('cannot judge entries without revisions, so it lets them through', () => {
    expect(isStaleEntry(makeDelay(), makeDelay())).toBe(false);
    expect(isStaleEntry(undefined, makeEvent(1))).toBe(false);
  });
});
