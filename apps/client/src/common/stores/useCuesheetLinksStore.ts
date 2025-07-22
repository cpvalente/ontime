import { create } from 'zustand';

type Target = 'cuesheet' | 'timer' | 'clock' | 'countdown' | 'backstage' | 'studio';

interface SelectionState {
  [key: string]: boolean;
}

interface ColumnPermissions {
  read: string[];
  write: string[];
}

interface CuesheetLinksState {
  target: Target | null;
  readSelected: SelectionState;
  writeSelected: SelectionState;
  setTarget: (target: Target | null) => void;
  setField: (field: 'read' | 'write', key: string, value: boolean) => void;
  toggleField: (field: 'read' | 'write', key: string) => void;
  selectAll: (field: 'read' | 'write', keys: string[]) => void;
  clearAll: (field: 'read' | 'write', keys: string[]) => void;
  // Returns arrays of column keys that have read/write permissions if target is 'cuesheet'
  getSelections: () => ColumnPermissions | null;
}

export const useCuesheetLinksStore = create<CuesheetLinksState>((set, get) => ({
  target: null,
  readSelected: {},
  writeSelected: {},
  setTarget: (target) => set({ target }),
  setField: (field, key, value) =>
    set((state) => ({
      ...(field === 'read'
        ? { readSelected: { ...state.readSelected, [key]: value } }
        : { writeSelected: { ...state.writeSelected, [key]: value } }),
    })),
  toggleField: (field, key) =>
    set((state) => ({
      ...(field === 'read'
        ? { readSelected: { ...state.readSelected, [key]: !state.readSelected[key] } }
        : { writeSelected: { ...state.writeSelected, [key]: !state.writeSelected[key] } }),
    })),
  selectAll: (field, keys) =>
    set((_state) => ({
      ...(field === 'read'
        ? {
            readSelected: keys.reduce((acc, key) => {
              acc[key] = true;
              return acc;
            }, {} as SelectionState),
          }
        : {
            writeSelected: keys.reduce((acc, key) => {
              acc[key] = true;
              return acc;
            }, {} as SelectionState),
          }),
    })),
  clearAll: (field, keys) =>
    set((_state) => ({
      ...(field === 'read'
        ? {
            readSelected: keys.reduce((acc, key) => {
              acc[key] = false;
              return acc;
            }, {} as SelectionState),
          }
        : {
            writeSelected: keys.reduce((acc, key) => {
              acc[key] = false;
              return acc;
            }, {} as SelectionState),
          }),
    })),
  getSelections: () => {
    const state = get();
    if (state.target !== 'cuesheet') return null;

    return {
      read: Object.entries(state.readSelected)
        .filter(([_, selected]) => selected)
        .map(([key]) => key),
      write: Object.entries(state.writeSelected)
        .filter(([_, selected]) => selected)
        .map(([key]) => key),
    };
  },
}));
