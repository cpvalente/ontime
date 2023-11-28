import { isOntimeEvent, OntimeRundown } from 'ontime-types';
import { create } from 'zustand';

type EditMode = 'shift' | 'single' | 'ctrl';

interface EventSelectionStore {
  editMode: EditMode;
  eventsToEdit: Set<string>;
  anchoredEventIndex: number | null;
  setEditMode: (mode: EditMode) => void;
  setEventsToEdit: (id: string, index: number, rundown: OntimeRundown) => void;
  clearEventsToEdit: () => void;
}

export const useEventSelection = create<EventSelectionStore>()((set, get) => ({
  editMode: 'single',
  eventsToEdit: new Set(),
  anchoredEventIndex: null,
  setEditMode: (mode) => {
    return set(() => ({ editMode: mode }));
  },
  setEventsToEdit: (id, indexPlusOne, rundown) => {
    // indexes coming from rundown are not 0 based
    const index = indexPlusOne - 1;
    const { editMode, eventsToEdit, anchoredEventIndex } = get();

    if (editMode === 'single') {
      const setWithSingleEvent = new Set<string>([id]);

      return set(() => ({ eventsToEdit: setWithSingleEvent, anchoredEventIndex: index }));
    }

    if (editMode === 'ctrl') {
      const deduplicatedEventsToEdit = new Set([...eventsToEdit].filter((eventId) => eventId !== id));

      if (deduplicatedEventsToEdit.size !== eventsToEdit.size) {
        console.log([...eventsToEdit].at(indexPlusOne));

        return set(() => ({
          eventsToEdit: deduplicatedEventsToEdit,
          anchoredEventIndex: index,
        }));
      }

      return set(() => ({
        eventsToEdit: deduplicatedEventsToEdit.add(id),
        anchoredEventIndex: index,
      }));
    }

    if (editMode === 'shift') {
      const eventIds = rundown.filter(isOntimeEvent).map((event) => event.id);

      if (anchoredEventIndex === null) {
        const eventsUntilIndex = eventIds.slice(0, index + 1);

        return set(() => ({ eventsToEdit: new Set(eventsUntilIndex), anchoredEventIndex: index }));
      }

      if (anchoredEventIndex > index) {
        const eventsFromIndex = eventIds.slice(index, anchoredEventIndex + 1);

        return set(() => ({
          eventsToEdit: new Set(eventsFromIndex),
          anchoredEventIndex: index,
        }));
      }

      const eventsUntilIndex = eventIds.slice(anchoredEventIndex, index + 1);

      return set(() => ({
        eventsToEdit: new Set([...eventsUntilIndex, ...eventsToEdit]),
        anchoredEventIndex: index,
      }));
    }
  },
  clearEventsToEdit: () => set(() => ({ eventsToEdit: new Set<string>() })),
}));
