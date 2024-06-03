import { MouseEvent } from 'react';
import { isOntimeEvent, MaybeNumber, MaybeString, OntimeEvent, RundownCached } from 'ontime-types';
import { create } from 'zustand';

import { RUNDOWN } from '../../common/api/constants';
import { ontimeQueryClient } from '../../common/queryClient';
import { isMacOS } from '../../common/utils/deviceUtils';

export type SelectionMode = 'shift' | 'click' | 'ctrl';

interface EventSelectionStore {
  selectedEvents: Set<string>;
  anchoredIndex: MaybeNumber;
  cursor: MaybeString;
  setSelectedEvents: (selectionArgs: { id: string; index: number; selectMode: SelectionMode }) => void;
  clearSelectedEvents: () => void;
  clearMultiSelect: () => void;
  unselect: (id: string) => void;
}

export const useEventSelection = create<EventSelectionStore>()((set, get) => ({
  selectedEvents: new Set(),
  anchoredIndex: null,
  cursor: null,
  setSelectedEvents: (selectionArgs) => {
    const { id, index, selectMode } = selectionArgs;
    const { selectedEvents, anchoredIndex } = get();

    // on click, we replace selection with event
    if (selectMode === 'click') {
      return set({ selectedEvents: new Set([id]), anchoredIndex: index, cursor: id });
    }

    // on ctrl + click, we toggle the selection of that event
    if (selectMode === 'ctrl') {
      const rundownData = ontimeQueryClient.getQueryData<RundownCached>(RUNDOWN);
      if (!rundownData) return;

      // if it doesnt exist, simply add to the list and set an anchor
      if (!selectedEvents.has(id)) {
        return set({
          selectedEvents: selectedEvents.add(id),
          anchoredIndex: index,
          cursor: id,
        });
      }

      // if event is already selected, we remove it from selection
      // and set the anchor to the event after
      selectedEvents.delete(id);

      const nextIndex = rundownData.order.findIndex(
        (eventId, i) => i > index && isOntimeEvent(rundownData.rundown[eventId]) && selectedEvents.has(eventId),
      );

      // if we didnt find anything after, set the anchor to the last event
      return set({
        selectedEvents,
        anchoredIndex: nextIndex < 0 ? rundownData.order.length - 1 : nextIndex,
      });
    }

    // on shift + click, we select a range of events up to the clicked event
    if (selectMode === 'shift') {
      const rundownData = ontimeQueryClient.getQueryData<RundownCached>(RUNDOWN);
      if (!rundownData) return;

      // get list of rundown with only ontime events
      const events: OntimeEvent[] = [];
      rundownData.order.forEach((eventId) => {
        const event = rundownData.rundown[eventId];
        if (isOntimeEvent(event)) {
          events.push(event);
        }
      });

      const start = anchoredIndex === null ? 0 : Math.min(anchoredIndex, index);
      const end = anchoredIndex === null ? index : Math.max(anchoredIndex, index + 1);

      // create new set with range of ids from start to end
      const selectedEventIds = events.slice(start, end).map((event) => event.id);

      return set({
        selectedEvents: new Set([...selectedEvents, ...selectedEventIds]),
        anchoredIndex: index,
      });
    }
  },
  clearSelectedEvents: () => set({ selectedEvents: new Set(), anchoredIndex: null, cursor: null }),
  clearMultiSelect: () => {
    const { selectedEvents } = get();
    const [firstSelected] = selectedEvents;
    set({ selectedEvents: new Set(firstSelected || undefined), anchoredIndex: null });
  },
  unselect: (id: string) => {
    const { selectedEvents } = get();
    selectedEvents.delete(id);
    set({ selectedEvents });
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
