import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type OptionValues = {
  hideTableSeconds: boolean;
  hideIndexColumn: boolean;
  showDelayedTimes: boolean;
  hideDelays: boolean;
};

const defaultOptions: OptionValues = {
  hideTableSeconds: false,
  hideIndexColumn: false,
  showDelayedTimes: false,
  hideDelays: false,
};

export type RundownOptionKeys = keyof OptionValues;

export interface RundownOptions extends OptionValues {
  setOption: <K extends RundownOptionKeys>(key: K, value: OptionValues[K]) => void;
  toggleOption: (key: RundownOptionKeys) => void;
  resetOptions: () => void;
}

export const usePersistedRundownOptions = create<RundownOptions>()(
  persist(
    (set) => {
      return {
        ...defaultOptions,
        setOption: (key, value) => set((state) => ({ ...state, [key]: value })),
        toggleOption: (key) => set((state) => ({ ...state, [key]: !state[key] })),
        resetOptions: () => set(defaultOptions),
      };
    },
    {
      name: 'editor-options',
    },
  ),
);

export enum RundownViewMode {
  List = 'list',
  Table = 'table',
}
