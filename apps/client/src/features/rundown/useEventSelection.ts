import { isOntimeEvent, OntimeRundown } from 'ontime-types';
import { create } from 'zustand';

export type EditMode = 'shift' | 'click' | 'ctrl';

interface EventSelectionStore {
  selectedEvents: Set<string>;
  anchoredIndex: number | null;
  setSelectedEvents: (selectionArgs: { id: string; index: number; rundown: OntimeRundown; editMode: EditMode }) => void;
  clearSelectedEvents: () => void;
}

export const useEventSelection = create<EventSelectionStore>()((set, get) => ({
  selectedEvents: new Set(),
  anchoredIndex: null,
  setSelectedEvents: (selectionArgs) => {
    const { id, index: eventIndex, rundown, editMode } = selectionArgs;
    // event indexes are not 0 based
    const index = eventIndex - 1;

    const { selectedEvents, anchoredIndex } = get();

    if (editMode === 'click') {
      return set({ selectedEvents: new Set([id]), anchoredIndex: index });
    }

    if (editMode === 'ctrl') {
      if (selectedEvents.has(id)) {
        const eventIds = rundown.reduce(
          (newRundown, event, i) => {
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
          selectedEvents: selectedEvents,
          anchoredIndex: newAnchoredIndex?.index ?? 0,
        });
      }

      return set({
        selectedEvents: selectedEvents.add(id),
        anchoredIndex: index,
      });
    }

    if (editMode === 'shift') {
      const eventIds = rundown.filter(isOntimeEvent);

      if (anchoredIndex === null) {
        const eventsUntilIndex = eventIds.slice(0, eventIndex).map((event) => event.id);

        return set({ selectedEvents: new Set(eventsUntilIndex), anchoredIndex: index });
      }

      if (anchoredIndex > index) {
        const eventsFromIndex = eventIds.slice(index, anchoredIndex + 1).map((event) => event.id);

        return set({
          selectedEvents: new Set([...selectedEvents, ...eventsFromIndex]),
          anchoredIndex: index,
        });
      }

      const eventsUntilIndex = eventIds.slice(anchoredIndex, eventIndex).map((event) => event.id);

      return set({
        selectedEvents: new Set([...selectedEvents, ...eventsUntilIndex]),
        anchoredIndex: index,
      });
    }
  },
  clearSelectedEvents: () => set({ selectedEvents: new Set() }),
}));
