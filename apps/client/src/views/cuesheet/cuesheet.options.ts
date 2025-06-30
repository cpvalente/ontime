import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type OptionValues = {
  showActionMenu: boolean;
  hideTableSeconds: boolean;
  followPlayback: boolean;
  hidePast: boolean;
  hideIndexColumn: boolean;
  showDelayedTimes: boolean;
  hideDelays: boolean;
};

const defaultOptions: OptionValues = {
  showActionMenu: false,
  hideTableSeconds: false,
  followPlayback: false,
  hidePast: false,
  hideIndexColumn: false,
  showDelayedTimes: false,
  hideDelays: false,
};

export type CuesheetOptionKeys = keyof OptionValues;

export interface CuesheetOptions extends OptionValues {
  setOption: <K extends CuesheetOptionKeys>(key: K, value: OptionValues[K]) => void;
  toggleOption: (key: CuesheetOptionKeys) => void;
  resetOptions: () => void;
}

export const usePersistedCuesheetOptions = create<CuesheetOptions>()(
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
      name: 'cuesheet-options',
    },
  ),
);
