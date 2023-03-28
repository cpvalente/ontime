import { create } from 'zustand';

type EventEditorStore = {
  openId: string | null;
  setOpenEvent: (eventId: string) => void;
  removeOpenEvent: () => void;
};

export const useEventEditorStore = create<EventEditorStore>()((set) => ({
  openId: null,
  setOpenEvent: (eventId: string | null) => set({ openId: eventId }),
  removeOpenEvent: () => set({ openId: null }),
}));
