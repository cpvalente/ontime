import { create } from 'zustand';

type EntryCopyStore = {
  entryCopyId: string | null;
  entryCopyMode: 'copy' | 'cut';
  setEntryCopyId: (eventId: string | null, mode?: 'copy' | 'cut') => void;
};

export const useEntryCopy = create<EntryCopyStore>()((set) => ({
  entryCopyId: null,
  entryCopyMode: 'copy',
  setEntryCopyId: (entryCopyId: string | null, mode: 'copy' | 'cut' = 'copy') =>
    set({ entryCopyId, entryCopyMode: mode }),
}));
