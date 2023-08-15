import { create } from 'zustand';

interface EventIdSwappingStore {
  selectedEventId: string | null;
  setSelectedEventId: (newEventId: string | null) => void;
  clearSelectedEventId: () => void;
}

export const useEventIdSwapping = create<EventIdSwappingStore>((set) => ({
  selectedEventId: null,
  setSelectedEventId: (newEventId) => set(() => ({ selectedEventId: newEventId })),
  clearSelectedEventId: () => set(() => ({ selectedEventId: null })),
}));
