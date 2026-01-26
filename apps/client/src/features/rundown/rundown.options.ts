import { CustomFields } from 'ontime-types';
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

export const rundownDefaultColumns = [
  { value: 'flag', label: 'Flag' },
  { value: 'cue', label: 'Cue' },
  { value: 'title', label: 'Title' },
  { value: 'timeStart', label: 'Time start' },
  { value: 'timeEnd', label: 'Time end' },
  { value: 'duration', label: 'Duration' },
  { value: 'note', label: 'Note' },
];

export function makeRundownCustomColumns(customFields: CustomFields) {
  return Object.entries(customFields).map(([key, field]) => {
    return {
      value: `custom-${key}`,
      label: field.label,
    };
  });
}

export enum RundownViewMode {
  List = 'list',
  Table = 'table',
}
