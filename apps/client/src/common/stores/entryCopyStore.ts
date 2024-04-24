import { create } from 'zustand';

type EntryCopyStore = {
  entryCopyId: string | null;
  setEntryCopyId: (eventId: string | null) => void;
};

export const useEntryCopy = create<EntryCopyStore>()((set) => ({
  entryCopyId: null,
  setEntryCopyId: (entryCopyId: string | null) => set({ entryCopyId }),
}));
