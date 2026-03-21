import { create } from 'zustand';

type EntryCopyStore = {
  entryIds: Set<string>;
  sourceRundownId: string | null;
  setCopyEntries: (ids: string[], rundownId: string) => void;
  clearCopy: () => void;
};

export const useEntryCopy = create<EntryCopyStore>()((set) => ({
  entryIds: new Set(),
  sourceRundownId: null,
  setCopyEntries: (ids: string[], rundownId: string) =>
    set({ entryIds: new Set(ids), sourceRundownId: rundownId }),
  clearCopy: () => set({ entryIds: new Set(), sourceRundownId: null }),
}));
