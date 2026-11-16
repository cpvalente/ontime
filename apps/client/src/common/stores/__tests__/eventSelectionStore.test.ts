import { Rundown, SupportedEntry } from 'ontime-types';

import { createEventSelectionStore, getSelectionIndex } from '../eventSelectionStore';

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

function makeMixedRundown(): Rundown {
  const entries = {
    group: { id: 'group', type: SupportedEntry.Group },
    e1: { id: 'e1', type: SupportedEntry.Event, parent: 'group' },
    e2: { id: 'e2', type: SupportedEntry.Event, parent: 'group' },
    delay: { id: 'delay', type: SupportedEntry.Delay },
    milestone: { id: 'milestone', type: SupportedEntry.Milestone },
    e3: { id: 'e3', type: SupportedEntry.Event },
    e4: { id: 'e4', type: SupportedEntry.Event },
  };
  return {
    id: 'mixed',
    title: 'mixed',
    order: ['group', 'delay', 'milestone', 'e3', 'e4'],
    flatOrder: ['group', 'e1', 'e2', 'delay', 'milestone', 'e3', 'e4'],
    entries,
    revision: 1,
  } as unknown as Rundown;
}

describe('getSelectionIndex()', () => {
  const { entries, flatOrder } = makeMixedRundown();

  it.each([
    { id: 'e1', expected: 0 },
    { id: 'e3', expected: 2 },
    // other entries take the position of the next event
    { id: 'group', expected: 0 },
    { id: 'delay', expected: 2 },
    { id: 'milestone', expected: 2 },
  ])('counts only events before $id', ({ id, expected }) => {
    expect(getSelectionIndex(entries, flatOrder, id)).toBe(expected);
  });
});

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

  it('replaces the selection set so subscribers on the set re-render', () => {
    const store = createEventSelectionStore(() => makeRundown('rundown-a', ['a1', 'a2']));

    store.getState().setSelectedEvents({ id: 'a1', index: 0, selectMode: 'click' });
    const afterClick = store.getState().selectedEvents;

    store.getState().setSelectedEvents({ id: 'a2', index: 1, selectMode: 'ctrl' });
    const afterAdd = store.getState().selectedEvents;
    expect(afterAdd).not.toBe(afterClick);
    expect(afterAdd).toEqual(new Set(['a1', 'a2']));

    store.getState().unselect('a1');
    const afterUnselect = store.getState().selectedEvents;
    expect(afterUnselect).not.toBe(afterAdd);
    expect(afterUnselect).toEqual(new Set(['a2']));
  });

  it('moves the cursor off an entry removed with ctrl + click', () => {
    const store = createEventSelectionStore(() => makeRundown('rundown-a', ['a1', 'a2', 'a3']));

    store.getState().setSelectedEvents({ id: 'a1', index: 0, selectMode: 'click' });
    store.getState().setSelectedEvents({ id: 'a2', index: 1, selectMode: 'ctrl' });
    store.getState().setSelectedEvents({ id: 'a3', index: 2, selectMode: 'ctrl' });
    expect(store.getState().cursor).toBe('a3');

    store.getState().setSelectedEvents({ id: 'a3', index: 2, selectMode: 'ctrl' });
    expect(store.getState().cursor).toBe('a2');

    // removing an entry other than the cursor keeps the cursor
    store.getState().setSelectedEvents({ id: 'a1', index: 0, selectMode: 'ctrl' });
    expect(store.getState().cursor).toBe('a2');

    store.getState().setSelectedEvents({ id: 'a2', index: 1, selectMode: 'ctrl' });
    expect(store.getState().selectedEvents).toEqual(new Set());
    expect(store.getState().cursor).toBeNull();
  });

  it('moves the cursor off an unselected entry', () => {
    const store = createEventSelectionStore(() => makeRundown('rundown-a', ['a1', 'a2']));

    store.getState().setSelectedEvents({ id: 'a1', index: 0, selectMode: 'click' });
    store.getState().setSelectedEvents({ id: 'a2', index: 1, selectMode: 'ctrl' });

    store.getState().unselect('a2');
    expect(store.getState().cursor).toBe('a1');

    store.getState().unselect('a1');
    expect(store.getState().cursor).toBeNull();
  });

  it('keeps the cursor when clearing a multi selection', () => {
    const store = createEventSelectionStore(() => makeRundown('rundown-a', ['a1', 'a2', 'a3']));

    store.getState().setSelectedEvents({ id: 'a1', index: 0, selectMode: 'click' });
    store.getState().setSelectedEvents({ id: 'a3', index: 2, selectMode: 'ctrl' });
    store.getState().setSelectedEvents({ id: 'a2', index: 1, selectMode: 'ctrl' });

    store.getState().clearMultiSelect();
    expect(store.getState().selectedEvents).toEqual(new Set(['a2']));
    expect(store.getState().cursor).toBe('a2');
  });

  it('anchors on the next selected event after ctrl + click removes one', () => {
    const rundown = makeMixedRundown();
    const store = createEventSelectionStore(() => rundown);

    store.getState().setSelectedEvents({ id: 'e1', index: 0, selectMode: 'click' });
    store.getState().setSelectedEvents({ id: 'e3', index: 2, selectMode: 'ctrl' });
    store.getState().setSelectedEvents({ id: 'e1', index: 0, selectMode: 'ctrl' });
    expect(store.getState().anchoredIndex).toBe(2);

    // with nothing selected after, the anchor falls back to the last event
    store.getState().setSelectedEvents({ id: 'e3', index: 2, selectMode: 'ctrl' });
    expect(store.getState().anchoredIndex).toBe(3);
  });

  it('does not select when the rundown is unavailable', () => {
    const store = createEventSelectionStore(() => undefined);

    store.getState().setSelectedEvents({ id: 'a1', index: 0, selectMode: 'shift' });

    expect(store.getState().selectedEvents).toEqual(new Set());
  });
});
