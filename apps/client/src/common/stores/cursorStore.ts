import { create } from 'zustand';

import { booleanFromLocalStorage } from '../utils/localStorage';

type CursorStore = {
  cursor: number;
  isCursorLocked: boolean;
  toggleCursorLocked: (newValue?: boolean) => void;
  moveCursorUp: () => void;
  moveCursorDown: () => void;
  moveCursorTo: (index: number) => void;
};

const cursorLockedKey = 'ontime-cursor-islocked';

export const useCursor = create<CursorStore>()((set) => ({
  cursor: 0,
  isCursorLocked: booleanFromLocalStorage(cursorLockedKey, false),
  toggleCursorLocked: (newValue?: boolean) =>
    set((state) => {
      const val = typeof newValue === 'undefined' ? !state.isCursorLocked : newValue;
      localStorage.setItem(cursorLockedKey, String(val));
      return { isCursorLocked: val };
    }),
  moveCursorUp: () => set((state) => ({ cursor: Math.max(state.cursor - 1, 0) })),
  moveCursorDown: () => set((state) => ({ cursor: state.cursor + 1 })),
  moveCursorTo: (index: number) => set((state) => ({ cursor: index >=0 ? index : state.cursor })),
}));
