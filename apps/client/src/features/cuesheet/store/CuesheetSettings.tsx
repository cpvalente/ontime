import { create } from 'zustand';

import { booleanFromLocalStorage } from '../../../common/utils/localStorage';

interface CuesheetSettings {
  showSettings: boolean;
  followSelected: boolean;
  showDelayBlock: boolean;
  showPrevious: boolean;

  toggleSettings: (newValue?: boolean) => void;
  toggleFollow: (newValue?: boolean) => void;
  toggleDelayVisibility: (newValue?: boolean) => void;
  togglePreviousVisibility: (newValue?: boolean) => void;
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
      const followSelected = toggle(state.followSelected, newValue);
      localStorage.setItem(CuesheetKeys.Follow, String(followSelected));
      return { followSelected };
    }),
  toggleDelayVisibility: (newValue?: boolean) =>
    set((state) => {
      const showDelayBlock = toggle(state.showDelayBlock, newValue);
      localStorage.setItem(CuesheetKeys.DelayVisibility, String(showDelayBlock));
      return { showDelayBlock };
    }),
  togglePreviousVisibility: (newValue?: boolean) =>
    set((state) => {
      const showPrevious = toggle(state.showPrevious, newValue);
      localStorage.setItem(CuesheetKeys.PreviousVisibility, String(showPrevious));
      return { showPrevious };
    }),
}));
