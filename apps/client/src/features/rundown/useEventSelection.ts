import { isOntimeEvent, OntimeRundown } from 'ontime-types';
import { create } from 'zustand';

// culled from:
// https://stackoverflow.com/questions/54134156/javascript-merge-two-arrays-of-objects-only-if-not-duplicate-based-on-specifi
const getMergedEvents = (initialArr: string[], newArr: string[]) => {
  const eventIds = new Set(initialArr.map((id) => id));
  return [...initialArr, ...newArr.filter((id) => !eventIds.has(id))];
};

type EditMode = 'shift' | 'click' | 'ctrl';

interface EventSelectionStore {
  editMode: EditMode;
  eventsToEdit: string[];
  anchoredIndex: number | null;
  setEditMode: (mode: EditMode) => void;
  setEventsToEdit: (id: string, index: number, rundown: OntimeRundown) => void;
  clearEventsToEdit: () => void;
}

export const useEventSelection = create<EventSelectionStore>()((set, get) => ({
  editMode: 'click',
  eventsToEdit: [],
  anchoredIndex: null,
  setEditMode: (mode) => set(() => ({ editMode: mode })),
  setEventsToEdit: (id, indexPlusOne, rundown) => {
    // indexes coming from rundown are not 0 based
    const index = indexPlusOne - 1;
    const { editMode, eventsToEdit, anchoredIndex } = get();

    if (editMode === 'click') {
      return set(() => ({ eventsToEdit: [id], anchoredIndex: index }));
    }

    if (editMode === 'ctrl') {
      const deduplicatedEventsToEdit = eventsToEdit.filter((eventId) => eventId !== id);

      if (deduplicatedEventsToEdit.length !== eventsToEdit.length) {
        const eventIds = rundown
          .filter(isOntimeEvent)
          .map((event, i) => ({ id: event.id, index: i }))
          .filter(({ id }) => eventsToEdit.includes(id));

        // find the next available higher index
        // if unavailable, then grab the last index of events
        const newAnchoredIndex = eventIds.find(({ index: eventIndex }) => eventIndex > index) ?? eventIds.at(-1);

        return set(() => ({
          eventsToEdit: deduplicatedEventsToEdit,
          anchoredIndex: newAnchoredIndex?.index ?? 0,
        }));
      }

      return set(() => ({
        eventsToEdit: deduplicatedEventsToEdit.toSpliced(index, 0, id),
        anchoredIndex: index,
      }));
    }

    if (editMode === 'shift') {
      const eventIds = rundown.filter(isOntimeEvent).map((event) => event.id);

      if (anchoredIndex === null) {
        const eventsUntilIndex = eventIds.slice(0, indexPlusOne);

        return set(() => ({ eventsToEdit: eventsUntilIndex, anchoredIndex: index }));
      }

      if (anchoredIndex > index) {
        const eventsFromIndex = eventIds.slice(index, anchoredIndex + 1);

        return set(() => ({
          eventsToEdit: getMergedEvents(eventsToEdit, eventsFromIndex),
          anchoredIndex: index,
        }));
      }

      const eventsUntilIndex = eventIds.slice(anchoredIndex, indexPlusOne);

      return set(() => ({
        eventsToEdit: getMergedEvents(eventsToEdit, eventsUntilIndex),
        anchoredIndex: index,
      }));
    }
  },
  clearEventsToEdit: () => set(() => ({ eventsToEdit: [] })),
}));
