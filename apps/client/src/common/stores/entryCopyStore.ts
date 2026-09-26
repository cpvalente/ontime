import { EntryId } from 'ontime-types';
import { useCallback } from 'react';
import { create } from 'zustand';

import { useRundownScope } from '../context/RundownScopeContext';

export type EntryClipboard = {
  /** ids can repeat across rundowns, eg: in a duplicated rundown */
  sourceRundownId: string;
  /** in rundown order */
  entryIds: EntryId[];
  mode: 'copy' | 'cut';
};

type EntryCopyStore = {
  clipboard: EntryClipboard | null;
  setClipboard: (clipboard: EntryClipboard | null) => void;
};

/**
 * One clipboard for every rundown surface.
 * It keeps the rundown the entries were copied from, pasting into a different rundown is not yet supported.
 */
export const useEntryCopy = create<EntryCopyStore>()((set) => ({
  clipboard: null,
  setClipboard: (clipboard) => set({ clipboard }),
}));

export function isEntryInClipboard(clipboard: EntryClipboard | null, rundownId: string, entryId: EntryId): boolean {
  return clipboard !== null && clipboard.sourceRundownId === rundownId && clipboard.entryIds.includes(entryId);
}

/** Whether an entry of the enclosing rundown scope is on the clipboard */
export function useIsEntryCopyTarget(entryId: EntryId) {
  const { rundownId } = useRundownScope();
  return useEntryCopy((state) => isEntryInClipboard(state.clipboard, rundownId, entryId));
}

/** Puts entries of the enclosing rundown scope on the clipboard, an empty list clears it */
export function useSetEntryCopy() {
  const { rundownId } = useRundownScope();
  const setClipboard = useEntryCopy((state) => state.setClipboard);
  return useCallback(
    (entryIds: EntryId[], mode: 'copy' | 'cut' = 'copy') =>
      setClipboard(entryIds.length > 0 ? { sourceRundownId: rundownId, entryIds, mode } : null),
    [setClipboard, rundownId],
  );
}
