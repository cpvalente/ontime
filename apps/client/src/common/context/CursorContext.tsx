import { createContext, ReactNode, useCallback, useMemo, useState } from 'react';

import { useLocalStorage } from '../hooks/useLocalStorage';

interface CursorContextState {
  cursor: number;
  isCursorLocked: boolean;
  toggleCursorLocked: (newValue?: boolean) => void;
  setCursor: (index: number) => void;
  moveCursorUp: () => void;
  moveCursorDown: () => void;
  moveCursorTo: (index: number) => void;
}

export const CursorContext = createContext<CursorContextState>({
  cursor: 0,
  isCursorLocked: false,
  toggleCursorLocked: () => undefined,
  setCursor: () => undefined,
  moveCursorUp: () => undefined,
  moveCursorDown: () => undefined,
  moveCursorTo: () => undefined,
});

interface CursorProviderProps {
  children: ReactNode
}

export const CursorProvider = ({ children }: CursorProviderProps) => {
  const [cursor, setCursor] = useState(0);
  const [_cursorLocked, _setCursorLocked] = useLocalStorage('isCursorLocked', 'locked');
  const isCursorLocked = useMemo(() => _cursorLocked === 'locked', [_cursorLocked]);

  const cursorLockedOff = useCallback(() => _setCursorLocked('unlocked'), [_setCursorLocked]);
  const cursorLockedOn = useCallback(() => _setCursorLocked('locked'), [_setCursorLocked]);

  const moveCursorUp = useCallback(() => {
    setCursor((prev) => Math.max(prev - 1, 0));
  }, []);

  const moveCursorDown = useCallback(() => {
    setCursor((prev) => prev + 1);
  }, []);

  /**
   * @param {boolean | undefined} newValue
   */
  const toggleCursorLocked = useCallback(
    (newValue?: boolean) => {
      if (typeof newValue === 'undefined') {
        if (isCursorLocked) {
          cursorLockedOff();
        } else {
          cursorLockedOn();
        }
      } else if (!newValue) {
        cursorLockedOff();
      } else if (newValue) {
        cursorLockedOn();
      }
    },
    [cursorLockedOff, cursorLockedOn, isCursorLocked]
  );
  
  // moves cursor to given index
  const moveCursorTo = useCallback((index: number) => {
    setCursor(index);
  }, []);

  return (
    <CursorContext.Provider
      value={{
        cursor,
        isCursorLocked,
        toggleCursorLocked,
        setCursor,
        moveCursorUp,
        moveCursorDown,
        moveCursorTo,
      }}
    >
      {children}
    </CursorContext.Provider>
  );
};
