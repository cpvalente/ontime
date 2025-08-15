import { create } from 'zustand';

import { booleanFromLocalStorage } from '../utils/localStorage';

enum LocalEventKeys {
  Mirror = 'view-mirror',
}

type ViewOptionsStore = {
  mirror: boolean;
  toggleMirror: (newValue?: boolean) => void;
};

export const useViewOptionsStore = create<ViewOptionsStore>()((set) => ({
  mirror: booleanFromLocalStorage(LocalEventKeys.Mirror, false),
  toggleMirror: (newValue?: boolean) =>
    set((state) => {
      const val = typeof newValue === 'undefined' ? !state.mirror : newValue;
      localStorage.setItem(LocalEventKeys.Mirror, String(val));
      return { mirror: val };
    }),
}));
