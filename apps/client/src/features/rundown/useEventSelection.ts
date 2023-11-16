import { isOntimeEvent, OntimeRundown } from 'ontime-types';
import { create } from 'zustand';

type EditMode = 'range' | 'single' | 'cherryPick';

interface EventSelectionStore {
  editMode: EditMode;
  eventsToEdit: Set<string>;
  anchoredEventIndex: number | null;
  isEventSelected: (id: string) => boolean;
  setEditMode: (mode: EditMode) => void;
  setEventsToEdit: (id: string, index: number, rundown: OntimeRundown) => void;
  clearEventsToEdit: () => void;
}

export const useEventSelection = create<EventSelectionStore>()((set, get) => ({
  editMode: 'single',
  eventsToEdit: new Set(),
  anchoredEventIndex: null,
  isEventSelected: (id) => {
    const { eventsToEdit } = get();

    return eventsToEdit.has(id);
  },
  setEditMode: (mode) => set(() => ({ editMode: mode })),
  setEventsToEdit: (id, indexPlusOne, rundown) => {
    // indexes coming from rundown are not 0 based
    const index = indexPlusOne - 1;
    const { editMode, eventsToEdit, anchoredEventIndex } = get();

    if (editMode === 'single') {
      const setWithSingleEvent = new Set<string>([id]);

      return set(() => ({ eventsToEdit: setWithSingleEvent, anchoredEventIndex: index }));
    }

    if (editMode === 'cherryPick') {
      const deduplicatedEventsToEdit = new Set([...eventsToEdit].filter((eventId) => eventId !== id));

      if (deduplicatedEventsToEdit.size !== eventsToEdit.size) {
        // const lastEventIdInSet = [...eventsToEdit].at(-1);

        // if (lastEventIdInSet === id) {
        // }

        return set(() => ({
          eventsToEdit: deduplicatedEventsToEdit,
          anchoredEventIndex: indexPlusOne,
        }));
      }

      return set(() => ({
        eventsToEdit: deduplicatedEventsToEdit.add(id),
      }));
    }

    if (editMode === 'range') {
      const eventIds = rundown.filter(isOntimeEvent).map((event) => event.id);

      console.log(anchoredEventIndex);

      if (anchoredEventIndex === null) {
        const eventsUntilIndex = eventIds.slice(0, index);

        return set(() => ({ eventsToEdit: new Set(eventsUntilIndex), anchoredEventIndex: index }));
      }

      if (anchoredEventIndex > index) {
        const eventsFromIndex = eventIds.slice(index, anchoredEventIndex);

        return set(() => ({
          eventsToEdit: new Set([...eventsToEdit, ...eventsFromIndex]),
        }));
      }

      const eventsUntilIndex = eventIds.slice(anchoredEventIndex, indexPlusOne);

      return set(() => ({
        eventsToEdit: new Set([...eventsToEdit, ...eventsUntilIndex]),
      }));
    }
  },
  clearEventsToEdit: () => set(() => ({ eventsToEdit: new Set<string>() })),
}));
