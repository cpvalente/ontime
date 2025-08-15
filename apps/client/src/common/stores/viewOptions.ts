// eslint-disable-next-line simple-import-sort/imports
import { create } from 'zustand';

import { booleanFromLocalStorage } from '../utils/localStorage';
import { baseURI } from '../../externals';

enum LocalEventKeys {
  Mirror = 'ontime-view-mirror',
}

type ViewOptionsStore = {
  mirror: boolean;
  toggleMirror: (newValue?: boolean) => void;
};

export const useViewOptionsStore = create<ViewOptionsStore>()((set) => ({
  mirror: booleanFromLocalStorage(`${baseURI}${LocalEventKeys.Mirror}`, false),
  toggleMirror: (newValue?: boolean) =>
    set((state) => {
      const val = typeof newValue === 'undefined' ? !state.mirror : newValue;
      localStorage.setItem(`${baseURI}${LocalEventKeys.Mirror}`, String(val));
      return { mirror: val };
    }),
}));
