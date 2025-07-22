import { CustomFields } from 'ontime-types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type OptionValues = {
  hideTableSeconds: boolean;
  hidePast: boolean;
  hideIndexColumn: boolean;
  showDelayedTimes: boolean;
  hideDelays: boolean;
};

const defaultOptions: OptionValues = {
  hideTableSeconds: false,
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

export const cuesheetDefaultColumns = [
  { value: 'flag', label: 'Flag' },
  { value: 'cue', label: 'Cue' },
  { value: 'title', label: 'Title' },
  { value: 'timeStart', label: 'Time start' },
  { value: 'timeEnd', label: 'Time end' },
  { value: 'duration', label: 'Duration' },
  { value: 'note', label: 'Note' },
];

export function makeCuesheetCustomColumns(customFields: CustomFields) {
  return Object.entries(customFields).map(([key, field]) => {
    return {
      value: `custom-${key}`,
      label: field.label,
    };
  });
}
