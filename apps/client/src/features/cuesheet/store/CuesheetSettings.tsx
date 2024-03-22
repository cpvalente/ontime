import { create } from 'zustand';

import { booleanFromLocalStorage } from '../../../common/utils/localStorage';

interface CuesheetSettings {
  showSettings: boolean;
  followSelected: boolean;
  showPrevious: boolean;
  showDelayBlock: boolean;
  showDelayedTimes: boolean;

  toggleSettings: (newValue?: boolean) => void;
  toggleFollow: (newValue?: boolean) => void;
  togglePreviousVisibility: (newValue?: boolean) => void;
  toggleDelayVisibility: (newValue?: boolean) => void;
  toggleDelayedTimes: (newValue?: boolean) => void;
}

function toggle(oldValue: boolean, value?: boolean) {
  console.log('toggle', oldValue, value)
  if (typeof value === 'undefined') {
    return !oldValue;
  }
  return value;
}

enum CuesheetKeys {
  Follow = 'ontime-cuesheet-follow-selected',
  DelayVisibility = 'ontime-cuesheet-show-delay',
  PreviousVisibility = 'ontime-cuesheet-show-previous',
  DelayedTimes = 'ontime-cuesheet-show-delayed',
}

export const useCuesheetSettings = create<CuesheetSettings>()((set) => ({
  showSettings: false,
  followSelected: booleanFromLocalStorage(CuesheetKeys.Follow, false),
  showPrevious: booleanFromLocalStorage(CuesheetKeys.PreviousVisibility, true),
  showDelayBlock: booleanFromLocalStorage(CuesheetKeys.DelayVisibility, true),
  showDelayedTimes: booleanFromLocalStorage(CuesheetKeys.DelayedTimes, false),

  toggleSettings: (newValue?: boolean) => set((state) => ({ showSettings: toggle(state.showSettings, newValue) })),
  toggleFollow: (newValue?: boolean) =>
    set((state) => {
      const followSelected = toggle(state.followSelected, newValue);
      localStorage.setItem(CuesheetKeys.Follow, String(followSelected));
      return { followSelected };
    }),
  togglePreviousVisibility: (newValue?: boolean) =>
    set((state) => {
      const showPrevious = toggle(state.showPrevious, newValue);
      localStorage.setItem(CuesheetKeys.PreviousVisibility, String(showPrevious));
      return { showPrevious };
    }),
  toggleDelayVisibility: (newValue?: boolean) =>
    set((state) => {
      const showDelayBlock = toggle(state.showDelayBlock, newValue);
      localStorage.setItem(CuesheetKeys.DelayVisibility, String(showDelayBlock));
      return { showDelayBlock };
    }),
  toggleDelayedTimes: (newValue?: boolean) =>
    set((state) => {
      const showDelayedTimes = toggle(state.showDelayedTimes, newValue);
      localStorage.setItem(CuesheetKeys.DelayedTimes, String(showDelayedTimes));
      return { showDelayedTimes };
    }),
}));
