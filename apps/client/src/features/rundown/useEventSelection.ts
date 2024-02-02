import { MouseEvent } from 'react';
import { isOntimeEvent, OntimeEvent, RundownCached } from 'ontime-types';
import { create } from 'zustand';

import { RUNDOWN } from '../../common/api/apiConstants';
import { ontimeQueryClient } from '../../common/queryClient';
import { isMacOS } from '../../common/utils/deviceUtils';

export type SelectionMode = 'shift' | 'click' | 'ctrl';

interface EventSelectionStore {
  selectedEvents: Set<string>;
  anchoredIndex: number | null;
  setSelectedEvents: (selectionArgs: { id: string; index: number; selectMode: SelectionMode }) => void;
  clearSelectedEvents: () => void;
}

export const useEventSelection = create<EventSelectionStore>()((set, get) => ({
  selectedEvents: new Set(),
  anchoredIndex: null,
  setSelectedEvents: (selectionArgs) => {
    const { id, index, selectMode } = selectionArgs;
    const { selectedEvents, anchoredIndex } = get();

    if (selectMode === 'click') {
      return set({ selectedEvents: new Set([id]), anchoredIndex: index });
    }

    if (selectMode === 'ctrl') {
      const rundownData = ontimeQueryClient.getQueryData<RundownCached>(RUNDOWN);
      if (!rundownData) return;

      if (selectedEvents.has(id)) {
        const eventIds = rundownData.order.reduce(
          (newRundown, eventId, i) => {
            const event = rundownData.rundown[eventId];

            if (isOntimeEvent(event) && selectedEvents.has(id)) {
              return newRundown.concat({ id: event.id, index: i });
            }

            return newRundown;
          },
          [] as { id: string; index: number }[],
        );

        // find the next available higher index
        // if unavailable, then grab the last index of events
        const newAnchoredIndex = eventIds.find(({ index: eventIndex }) => eventIndex > index) ?? eventIds.at(-1);

        selectedEvents.delete(id);

        return set({
          selectedEvents,
          anchoredIndex: newAnchoredIndex?.index ?? 0,
        });
      }

      return set({
        selectedEvents: selectedEvents.add(id),
        anchoredIndex: index,
      });
    }

    if (selectMode === 'shift') {
      const rundownData = ontimeQueryClient.getQueryData<RundownCached>(RUNDOWN);
      if (!rundownData) return;

      const events: OntimeEvent[] = [];
      rundownData.order.forEach((eventId) => {
        const event = rundownData.rundown[eventId];
        if (isOntimeEvent(event)) {
          events.push(event);
        }
      });

      if (anchoredIndex === null) {
        const eventsUntilIndex = events.slice(0, index).map((event) => event.id);

        return set({ selectedEvents: new Set(eventsUntilIndex), anchoredIndex: index });
      }

      if (anchoredIndex > index) {
        const eventsFromIndex = events.slice(index, anchoredIndex + 1).map((event) => event.id);

        return set({
          selectedEvents: new Set([...selectedEvents, ...eventsFromIndex]),
          anchoredIndex: index,
        });
      }

      const eventsUntilIndex = events.slice(anchoredIndex, index).map((event) => event.id);

      return set({
        selectedEvents: new Set([...selectedEvents, ...eventsUntilIndex]),
        anchoredIndex: index,
      });
    }
  },
  clearSelectedEvents: () => set({ selectedEvents: new Set() }),
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
