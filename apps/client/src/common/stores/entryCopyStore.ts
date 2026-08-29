import { create } from 'zustand';

type EntryCopyStore = {
  entryCopyId: string | null;
  /** rundown the copied entry belongs to, so a paste knows whether it crosses rundowns */
  entryCopyRundownId: string | null;
  entryCopyMode: 'copy' | 'cut';
  setEntryCopyId: (eventId: string | null, rundownId: string | null, mode?: 'copy' | 'cut') => void;
};

/**
 * The clipboard is shared across rundowns so entries can be moved between them
 */
export const useEntryCopy = create<EntryCopyStore>()((set) => ({
  entryCopyId: null,
  entryCopyRundownId: null,
  entryCopyMode: 'copy',
  setEntryCopyId: (entryCopyId: string | null, entryCopyRundownId: string | null, mode: 'copy' | 'cut' = 'copy') =>
    set({ entryCopyId, entryCopyRundownId, entryCopyMode: mode }),
}));
