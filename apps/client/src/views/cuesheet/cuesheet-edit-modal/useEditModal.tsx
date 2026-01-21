import { EntryId } from 'ontime-types';
import { create } from 'zustand';

interface SelectedEntryState {
  selectedEntryId: EntryId | null;
  setEditableEntry: (entryId: EntryId) => void;
  clearSelection: () => void;
}

export const useEditModal = create<SelectedEntryState>((set) => ({
  selectedEntryId: null,
  setEditableEntry: (entryId: EntryId) => set({ selectedEntryId: entryId }),
  clearSelection: () => set({ selectedEntryId: null }),
}));
