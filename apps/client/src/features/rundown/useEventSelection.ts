import { isOntimeEvent, OntimeRundown } from 'ontime-types';
import { create } from 'zustand';

// culled from:
// https://stackoverflow.com/questions/54134156/javascript-merge-two-arrays-of-objects-only-if-not-duplicate-based-on-specifi
const deduplicateEventsToEdit = (initialArr: EventToEdit[], newArr: EventToEdit[]) => {
  const eventIds = new Set(initialArr.map((event) => event.id));
  return [...initialArr, ...newArr.filter((event) => !eventIds.has(event.id))];
};

type EditMode = 'range' | 'single' | 'cherryPick';
type EventToEdit = { id: string; index: number };

interface EventSelectionStore {
  editMode: EditMode;
  eventsToEdit: EventToEdit[];
  anchoredEventIndex: number | null;
  isEventSelected: (id: string) => boolean;
  setEditMode: (mode: EditMode) => void;
  setEventsToEdit: (id: string, index: number, rundown: OntimeRundown) => void;
  clearEventsToEdit: () => void;
}

export const useEventSelection = create<EventSelectionStore>()((set, get) => ({
  editMode: 'single',
  eventsToEdit: [],
  anchoredEventIndex: null,
  isEventSelected: (id) => {
    const { eventsToEdit } = get();

    return eventsToEdit.some((event) => event.id === id);
  },
  setEditMode: (mode) => set(() => ({ editMode: mode })),
  setEventsToEdit: (id, indexPlusOne, rundown) => {
    // indexes coming from rundown are not 0 based
    const index = indexPlusOne - 1;
    const { editMode, eventsToEdit, anchoredEventIndex } = get();

    if (editMode === 'single') {
      return set(() => ({ eventsToEdit: [{ id, index }], anchoredEventIndex: index }));
    }

    if (editMode === 'cherryPick') {
      const deduplicatedEventsToEdit = eventsToEdit.filter(({ id: eventId }) => eventId !== id);

      if (deduplicatedEventsToEdit.length !== eventsToEdit.length) {
        const nextAvailableEvent = eventsToEdit.at(index);

        console.log(nextAvailableEvent, eventsToEdit, { index, id });

        return set(() => ({
          eventsToEdit: deduplicatedEventsToEdit,
          anchoredEventIndex: nextAvailableEvent?.index,
        }));
      }

      return set(() => ({
        eventsToEdit: [{ id, index }].concat(deduplicatedEventsToEdit),
        anchoredEventIndex: index,
      }));
    }

    if (editMode === 'range') {
      const events = rundown.filter(isOntimeEvent).map((event, i) => ({ id: event.id, index: i }));

      if (anchoredEventIndex === null) {
        const eventsUntilIndex = events.slice(0, index);
        return set(() => ({ eventsToEdit: eventsUntilIndex, anchoredEventIndex: index }));
      }

      if (anchoredEventIndex > index) {
        const eventsFromIndex = events.slice(index, anchoredEventIndex);

        return set(() => ({
          eventsToEdit: [{ id, index }].concat(deduplicateEventsToEdit(eventsToEdit, eventsFromIndex)),
        }));
      }

      const eventsUntilIndex = events.slice(anchoredEventIndex, index + 1);

      return set(() => ({
        eventsToEdit: deduplicateEventsToEdit(eventsToEdit, eventsUntilIndex),
      }));
    }
  },
  clearEventsToEdit: () => set(() => ({ eventsToEdit: [] })),
}));
