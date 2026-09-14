import { MaybeString } from 'ontime-types';
import { create } from 'zustand';

type EntryCopyStore = {
  entryCopyId: MaybeString;
  /** rundown the copied entry belongs to, so a paste knows whether it crosses rundowns */
  entryCopyRundownId: MaybeString;
  entryCopyMode: 'copy' | 'cut';
  setEntryCopyId: (eventId: MaybeString, rundownId: MaybeString, mode?: 'copy' | 'cut') => void;
};

/**
 * The clipboard is shared across rundowns so entries can be moved between them
 */
export const useEntryCopy = create<EntryCopyStore>()((set) => ({
  entryCopyId: null,
  entryCopyRundownId: null,
  entryCopyMode: 'copy',
  setEntryCopyId: (entryCopyId: MaybeString, entryCopyRundownId: MaybeString, mode: 'copy' | 'cut' = 'copy') =>
    set({ entryCopyId, entryCopyRundownId, entryCopyMode: mode }),
}));
