import { create } from 'zustand';

type EventCopyStore = {
  eventCopyId: string | null;
  setEventCopyId: (eventId: string | null) => void;
};

export const useEventCopy = create<EventCopyStore>()((set) => ({
  eventCopyId: null,
  setEventCopyId: (eventCopyId: string | null) => set(() => ({ eventCopyId })),
}));
