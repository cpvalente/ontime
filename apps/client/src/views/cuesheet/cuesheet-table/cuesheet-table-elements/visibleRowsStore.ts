import { create } from 'zustand';

interface VisibleRowsStore {
  visibleRows: Set<string>;
  addVisibleRow: (id: string) => void;
  removeVisibleRow: (id: string) => void;
}

export const useVisibleRowsStore = create<VisibleRowsStore>((set) => ({
  visibleRows: new Set(),
  addVisibleRow: (id) => set((state) => ({ visibleRows: new Set(state.visibleRows).add(id) })),
  removeVisibleRow: (id) =>
    set((state) => {
      const newSet = new Set(state.visibleRows);
      newSet.delete(id);
      return { visibleRows: newSet };
    }),
}));
