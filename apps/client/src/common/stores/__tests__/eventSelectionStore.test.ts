import { Rundown, SupportedEntry } from 'ontime-types';

import { createEventSelectionStore } from '../eventSelectionStore';

function makeRundown(id: string, eventIds: string[]): Rundown {
  return {
    id,
    title: id,
    order: eventIds,
    flatOrder: eventIds,
    entries: Object.fromEntries(eventIds.map((entryId) => [entryId, { id: entryId, type: SupportedEntry.Event }])),
    revision: 1,
  } as unknown as Rundown;
}

describe('createEventSelectionStore', () => {
  it('keeps selections of separate instances independent', () => {
    const first = createEventSelectionStore(() => makeRundown('rundown-a', ['a1', 'a2']));
    const second = createEventSelectionStore(() => makeRundown('rundown-b', ['b1', 'b2']));

    first.getState().setSingleEntrySelection({ id: 'a1' });
    second.getState().setSingleEntrySelection({ id: 'b2' });

    expect(first.getState().cursor).toBe('a1');
    expect(second.getState().cursor).toBe('b2');
    expect(first.getState().selectedEvents).toEqual(new Set(['a1']));
    expect(second.getState().selectedEvents).toEqual(new Set(['b2']));
  });

  it('resolves a shift range against the injected rundown', () => {
    const store = createEventSelectionStore(() => makeRundown('rundown-a', ['a1', 'a2', 'a3']));

    store.getState().setSelectedEvents({ id: 'a3', index: 2, selectMode: 'shift' });

    // without an anchor the range runs from the top up to the clicked index
    expect(store.getState().selectedEvents).toEqual(new Set(['a1', 'a2']));
    expect(store.getState().anchoredIndex).toBe(2);
  });

  it('does not select when the rundown is unavailable', () => {
    const store = createEventSelectionStore(() => undefined);

    store.getState().setSelectedEvents({ id: 'a1', index: 0, selectMode: 'shift' });

    expect(store.getState().selectedEvents).toEqual(new Set());
  });
});
