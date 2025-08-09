import { MouseEvent } from 'react';
import { EntryId, isOntimeEvent, MaybeNumber, MaybeString, Rundown } from 'ontime-types';
import { create } from 'zustand';

import { RUNDOWN } from '../../common/api/constants';
import { ontimeQueryClient } from '../../common/queryClient';
import { isMacOS } from '../../common/utils/deviceUtils';

type SelectionMode = 'shift' | 'click' | 'ctrl';

interface EventSelectionStore {
  selectedEvents: Set<EntryId>;
  anchoredIndex: MaybeNumber;
  cursor: MaybeString;
  entryMode: 'event' | 'single' | null;
  setSingleEntrySelection: (selectionArgs: { id: EntryId }) => void;
  setSelectedEvents: (selectionArgs: { id: EntryId; index: number; selectMode: SelectionMode }) => void;
  clearSelectedEvents: () => void;
  clearMultiSelect: () => void;
  unselect: (id: EntryId) => void;
}

export const useEventSelection = create<EventSelectionStore>()((set, get) => ({
  selectedEvents: new Set(),
  anchoredIndex: null,
  cursor: null,
  entryMode: null,
  setSingleEntrySelection: ({ id }) => {
    set({ selectedEvents: new Set([id]), anchoredIndex: null, cursor: id, entryMode: 'single' });
  },
  setSelectedEvents: ({ id, index, selectMode }) => {
    const { selectedEvents, anchoredIndex, entryMode } = get();

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
      const rundownData = ontimeQueryClient.getQueryData<Rundown>(RUNDOWN);
      if (!rundownData) return;

      // if it doesnt exist, simply add to the list and set an anchor
      if (!selectedEvents.has(id)) {
        return set({
          selectedEvents: selectedEvents.add(id),
          anchoredIndex: index,
          cursor: id,
          entryMode: 'event',
        });
      }

      // if event is already selected, we remove it from selection
      // and set the anchor to the event after
      selectedEvents.delete(id);

      const nextIndex = rundownData.order.findIndex(
        (eventId, i) => i > index && isOntimeEvent(rundownData.entries[eventId]) && selectedEvents.has(eventId),
      );

      // if we didnt find anything after, set the anchor to the last event
      return set({
        selectedEvents,
        anchoredIndex: nextIndex < 0 ? rundownData.order.length - 1 : nextIndex,
        entryMode: 'event',
      });
    }

    // on shift + click, we select a range of events up to the clicked event
    if (selectMode === 'shift') {
      const rundownData = ontimeQueryClient.getQueryData<Rundown>(RUNDOWN);
      if (!rundownData) return;

      // get list of rundown with only ontime events
      const eventIds: EntryId[] = [];
      rundownData.flatOrder.forEach((eventId) => {
        const event = rundownData.entries[eventId];
        if (isOntimeEvent(event)) {
          eventIds.push(event.id);
        }
      });

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
    const { selectedEvents } = get();
    const [firstSelected] = selectedEvents;
    set({ selectedEvents: new Set(firstSelected || undefined), anchoredIndex: null, entryMode: null });
  },
  unselect: (id: string) => {
    const { entryMode, selectedEvents } = get();
    selectedEvents.delete(id);
    set({
      selectedEvents,
      entryMode: selectedEvents.size === 0 ? null : entryMode,
    });
  },
}));

export function getSelectionMode(event: MouseEvent): SelectionMode {
  if ((isMacOS() && event.metaKey) || event.ctrlKey) {
    return 'ctrl';
  }

  if (event.shiftKey) {
    return 'shift';
  }

  return 'click';
}
