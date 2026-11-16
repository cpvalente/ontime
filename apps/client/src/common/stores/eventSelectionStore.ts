import { EntryId, MaybeNumber, Rundown, RundownEntries, isOntimeEvent } from 'ontime-types';
import { MouseEvent } from 'react';
import { StoreApi } from 'zustand';
import { createStore } from 'zustand/vanilla';

import { isMacOS } from '../utils/deviceUtils';

export type SelectionMode = 'shift' | 'click' | 'ctrl';

export interface EventSelectionStore {
  selectedEvents: Set<EntryId>;
  /** 0-based position among events, see getSelectionIndex() */
  anchoredIndex: MaybeNumber;
  cursor: EntryId | null;
  entryMode: 'event' | 'single' | null;
  scrollHandler: ((id: EntryId) => void) | null;
  setSingleEntrySelection: (selectionArgs: { id: EntryId }) => void;
  setSelectedEvents: (selectionArgs: { id: EntryId; index: number; selectMode: SelectionMode }) => void;
  clearSelectedEvents: () => void;
  clearMultiSelect: () => void;
  unselect: (id: EntryId) => void;
  setScrollHandler: (handler: ((id: EntryId) => void) | null) => void;
  scrollToEntry: (id: EntryId) => void;
}

export type EventSelectionStoreApi = StoreApi<EventSelectionStore>;

/**
 * Keeps track of the selected entries and selection mode
 * Provides methods to update the selection based on user interactions
 *
 * One store instance exists per rundown scope, so panels showing different
 * rundowns keep independent selections. The rundown the selection refers to is
 * injected as `getRundown` rather than resolved from the loaded rundown.
 */
export function createEventSelectionStore(getRundown: () => Rundown | undefined): EventSelectionStoreApi {
  return createStore<EventSelectionStore>()((set, get) => ({
    selectedEvents: new Set(),
    anchoredIndex: null,
    cursor: null,
    entryMode: null,
    scrollHandler: null,
    setSingleEntrySelection: ({ id }) => {
      set({ selectedEvents: new Set([id]), anchoredIndex: null, cursor: id, entryMode: 'single' });
    },
    setSelectedEvents: ({ id, index, selectMode }) => {
      const { selectedEvents, anchoredIndex, cursor, entryMode } = get();

      // if we are in single mode, we replace the selection and change the mode
      if (entryMode === 'single') {
        return set({ selectedEvents: new Set([id]), anchoredIndex: index, cursor: id, entryMode: 'event' });
      }

      // on click, we replace selection with event
      if (selectMode === 'click') {
        return set({ selectedEvents: new Set([id]), anchoredIndex: index, cursor: id, entryMode: 'event' });
      }

      // on ctrl + click, we toggle the selection of that event
      if (selectMode === 'ctrl') {
        const rundownData = getRundown();
        if (!rundownData) return;

        // if it doesnt exist, simply add to the list and set an anchor
        if (!selectedEvents.has(id)) {
          return set({
            selectedEvents: new Set(selectedEvents).add(id),
            anchoredIndex: index,
            cursor: id,
            entryMode: 'event',
          });
        }

        // if event is already selected, we remove it from selection
        // and set the anchor to the event after
        const withoutId = new Set(selectedEvents);
        withoutId.delete(id);

        const eventIds = getEventIds(rundownData);
        const nextIndex = eventIds.findIndex((eventId, i) => i > index && withoutId.has(eventId));

        // if we didnt find anything after, set the anchor to the last event
        return set({
          selectedEvents: withoutId,
          anchoredIndex: nextIndex < 0 ? eventIds.length - 1 : nextIndex,
          cursor: keepCursorInSelection(cursor, withoutId),
          entryMode: 'event',
        });
      }

      // on shift + click, we select a range of events up to the clicked event
      if (selectMode === 'shift') {
        const rundownData = getRundown();
        if (!rundownData) return;

        const eventIds = getEventIds(rundownData);

        const start = anchoredIndex === null ? 0 : Math.min(anchoredIndex, index);
        const end = anchoredIndex === null ? index : Math.max(anchoredIndex, index + 1);

        // create new set with range of ids from start to end
        const selectedEventIds = eventIds.slice(start, end);

        return set({
          selectedEvents: new Set([...selectedEvents, ...selectedEventIds]),
          anchoredIndex: index,
          entryMode: 'event',
        });
      }
    },
    clearSelectedEvents: () => set({ selectedEvents: new Set(), anchoredIndex: null, cursor: null, entryMode: null }),
    clearMultiSelect: () => {
      const { selectedEvents, cursor } = get();
      const kept = keepCursorInSelection(cursor, selectedEvents);
      set({
        selectedEvents: new Set(kept ? [kept] : []),
        anchoredIndex: null,
        cursor: kept,
        entryMode: null,
      });
    },
    unselect: (id: string) => {
      const { entryMode, selectedEvents, cursor } = get();
      const remaining = new Set(selectedEvents);
      remaining.delete(id);
      set({
        selectedEvents: remaining,
        cursor: keepCursorInSelection(cursor, remaining),
        entryMode: remaining.size === 0 ? null : entryMode,
      });
    },
    // Sets the scroll handler for programmatic scrolling to entries
    setScrollHandler: (handler) => set({ scrollHandler: handler }),
    // Scrolls to the specified entry using the registered scroll handler
    scrollToEntry: (id: EntryId) => {
      const handler = get().scrollHandler;
      if (handler) {
        handler(id);
      }
    },
  }));
}

/** The rundown with only ontime events, which is what selection indexes count */
function getEventIds(rundown: Pick<Rundown, 'entries' | 'flatOrder'>): EntryId[] {
  return rundown.flatOrder.filter((id) => isOntimeEvent(rundown.entries[id]));
}

/**
 * The index the selection expects for an entry: its 0-based position among events
 * other entries take the position of the next event
 */
export function getSelectionIndex(entries: RundownEntries, flatOrder: EntryId[], id: EntryId): number {
  let index = 0;
  for (const entryId of flatOrder) {
    if (entryId === id) {
      break;
    }
    if (isOntimeEvent(entries[entryId])) {
      index++;
    }
  }
  return index;
}

/**
 * Keeps the cursor on a selected entry
 * if the cursor left the selection, it moves to the most recently selected entry
 */
function keepCursorInSelection(cursor: EntryId | null, selection: Set<EntryId>): EntryId | null {
  if (cursor && selection.has(cursor)) {
    return cursor;
  }
  return Array.from(selection).at(-1) ?? null;
}

export function getSelectionMode(event: MouseEvent): SelectionMode {
  if ((isMacOS() && event.metaKey) || event.ctrlKey) {
    return 'ctrl';
  }

  if (event.shiftKey) {
    return 'shift';
  }

  return 'click';
}
