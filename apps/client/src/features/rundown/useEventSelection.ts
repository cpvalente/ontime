import { isOntimeEvent, OntimeRundown } from 'ontime-types';
import { create } from 'zustand';

type EditMode = 'shift' | 'click' | 'ctrl';

interface EventSelectionStore {
  editMode: EditMode;
  eventsToEdit: Set<string>;
  anchoredIndex: number | null;
  setEditMode: (mode: EditMode) => void;
  setEventsToEdit: (id: string, index: number, rundown: OntimeRundown) => void;
  clearEventsToEdit: () => void;
}

export const useEventSelection = create<EventSelectionStore>()((set, get) => ({
  editMode: 'click',
  eventsToEdit: new Set(),
  anchoredIndex: null,
  setEditMode: (mode) => set({ editMode: mode }),
  setEventsToEdit: (id, indexPlusOne, rundown) => {
    // indexes coming from rundown are not 0 based
    const index = indexPlusOne - 1;
    const { editMode, eventsToEdit, anchoredIndex } = get();

    if (editMode === 'click') {
      return set({ eventsToEdit: new Set([id]), anchoredIndex: index });
    }

    if (editMode === 'ctrl') {
      if (eventsToEdit.has(id)) {
        const eventIds = rundown.reduce(
          (newRundown, event, i) => {
            if (isOntimeEvent(event) && eventsToEdit.has(id)) {
              return newRundown.concat({ id: event.id, index: i });
            }

            return newRundown;
          },
          [] as { id: string; index: number }[],
        );

        // find the next available higher index
        // if unavailable, then grab the last index of events
        const newAnchoredIndex = eventIds.find(({ index: eventIndex }) => eventIndex > index) ?? eventIds.at(-1);

        eventsToEdit.delete(id);

        return set({
          eventsToEdit: eventsToEdit,
          anchoredIndex: newAnchoredIndex?.index ?? 0,
        });
      }

      return set({
        eventsToEdit: eventsToEdit.add(id),
        anchoredIndex: index,
      });
    }

    if (editMode === 'shift') {
      const eventIds = rundown.filter(isOntimeEvent);

      if (anchoredIndex === null) {
        const eventsUntilIndex = eventIds.slice(0, indexPlusOne).map((event) => event.id);

        return set({ eventsToEdit: new Set(eventsUntilIndex), anchoredIndex: index });
      }

      if (anchoredIndex > index) {
        const eventsFromIndex = eventIds.slice(index, anchoredIndex + 1).map((event) => event.id);

        return set({
          eventsToEdit: new Set([...eventsToEdit, ...eventsFromIndex]),
          anchoredIndex: index,
        });
      }

      const eventsUntilIndex = eventIds.slice(anchoredIndex, indexPlusOne).map((event) => event.id);

      return set({
        eventsToEdit: new Set([...eventsToEdit, ...eventsUntilIndex]),
        anchoredIndex: index,
      });
    }
  },
  clearEventsToEdit: () => set({ eventsToEdit: new Set() }),
}));
