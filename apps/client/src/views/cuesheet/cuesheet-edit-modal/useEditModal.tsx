import { EntryId } from 'ontime-types';
import { create } from 'zustand';

interface SelectedEntryState {
  selectedEntryId: EntryId | null;
  /** the rundown the entry belongs to, the modal must not edit any other */
  selectedRundownId: string | null;
  setEditableEntry: (entryId: EntryId, rundownId: string) => void;
  clearSelection: () => void;
}

export const useEditModal = create<SelectedEntryState>((set) => ({
  selectedEntryId: null,
  selectedRundownId: null,
  setEditableEntry: (entryId, rundownId) => set({ selectedEntryId: entryId, selectedRundownId: rundownId }),
  clearSelection: () => set({ selectedEntryId: null, selectedRundownId: null }),
}));
