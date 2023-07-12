import create from 'zustand';

import { booleanFromLocalStorage } from '../../../common/utils/localStorage';

interface CuesheetSettings {
  showSettings: boolean;
  followSelected: boolean;
  showDelayBlock: boolean;
  showPrevious: boolean;

  toggleSettings: (val?: boolean) => void;
  toggleFollow: (val?: boolean) => void;
  toggleDelayVisibility: (val?: boolean) => void;
  togglePreviousVisibility: (val?: boolean) => void;
}

function toggle(oldValue: boolean, value?: boolean) {
  if (typeof value === 'undefined') {
    return !oldValue;
  }
  return value;
}

enum CuesheetKeys {
  Follow = 'ontime-cuesheet-follow-selected',
  DelayVisibility = 'ontime-cuesheet-show-delay',
  PreviousVisibility = 'ontime-cuesheet-show-previous',
}

export const useCuesheetSettings = create<CuesheetSettings>()((set) => ({
  showSettings: false,
  followSelected: booleanFromLocalStorage(CuesheetKeys.Follow, false),
  showDelayBlock: booleanFromLocalStorage(CuesheetKeys.DelayVisibility, true),
  showPrevious: booleanFromLocalStorage(CuesheetKeys.PreviousVisibility, true),

  toggleSettings: (newValue?: boolean) => set((state) => ({ showSettings: toggle(state.showSettings, newValue) })),
  toggleFollow: (newValue?: boolean) =>
    set((state) => {
      const value = toggle(state.followSelected, newValue);
      localStorage.setItem(CuesheetKeys.Follow, String(value));
      return { followSelected: value };
    }),
  toggleDelayVisibility: (newValue?: boolean) =>
    set((state) => {
      const value = toggle(state.showDelayBlock, newValue);
      localStorage.setItem(CuesheetKeys.DelayVisibility, String(value));
      return { showDelayBlock: value };
    }),
  togglePreviousVisibility: (newValue?: boolean) =>
    set((state) => {
      const value = toggle(state.showPrevious, newValue);
      localStorage.setItem(CuesheetKeys.PreviousVisibility, String(value));
      return { showPrevious: value };
    }),
}));
