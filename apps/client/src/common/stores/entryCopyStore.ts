import { EntryId, MaybeString } from 'ontime-types';
import { useCallback } from 'react';
import { create } from 'zustand';

import { useRundownScope } from '../context/RundownScopeContext';

type EntryCopyStore = {
  entryCopyId: MaybeString;
  entryCopyRundownId: MaybeString;
  entryCopyMode: 'copy' | 'cut';
  setEntryCopyId: (eventId: MaybeString, rundownId: MaybeString, mode?: 'copy' | 'cut') => void;
};

/**
 * One clipboard for every rundown surface.
 * Entries are cloned and moved within their own rundown, so the source rundown
 * is kept to tell a paste into another rundown apart; that paste is not supported.
 */
export const useEntryCopy = create<EntryCopyStore>()((set) => ({
  entryCopyId: null,
  entryCopyRundownId: null,
  entryCopyMode: 'copy',
  setEntryCopyId: (entryCopyId: MaybeString, entryCopyRundownId: MaybeString, mode: 'copy' | 'cut' = 'copy') =>
    set({ entryCopyId, entryCopyRundownId, entryCopyMode: mode }),
}));

/** Whether an entry of the enclosing rundown scope is on the clipboard */
export function useIsEntryCopyTarget(entryId: string) {
  const { rundownId } = useRundownScope();
  // ids can repeat across rundowns, eg: in a duplicated rundown
  return useEntryCopy((state) => state.entryCopyId === entryId && state.entryCopyRundownId === rundownId);
}

/** Puts an entry of the enclosing rundown scope on the clipboard, or clears it */
export function useSetEntryCopy() {
  const { rundownId } = useRundownScope();
  const setEntryCopyId = useEntryCopy((state) => state.setEntryCopyId);
  return useCallback(
    (entryId: EntryId | null, mode?: 'copy' | 'cut') => setEntryCopyId(entryId, rundownId, mode),
    [setEntryCopyId, rundownId],
  );
}
