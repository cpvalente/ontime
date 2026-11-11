import { create } from 'zustand';

interface EventIdSwappingStore {
  selectedEventId: string | null;
  /** the rundown the event belongs to, an event can only swap with one of the same rundown */
  rundownId: string | null;
  setSelectedEventId: (newEventId: string | null, rundownId: string) => void;
  clearSelectedEventId: () => void;
}

export const useEventIdSwapping = create<EventIdSwappingStore>((set) => ({
  selectedEventId: null,
  rundownId: null,
  setSelectedEventId: (newEventId, rundownId) => set(() => ({ selectedEventId: newEventId, rundownId })),
  clearSelectedEventId: () => set(() => ({ selectedEventId: null, rundownId: null })),
}));
