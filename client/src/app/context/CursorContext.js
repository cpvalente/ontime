import { createContext, useCallback, useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const CursorContext = createContext({
  cursor: 0,
  isCursorLocked: false,

  setCursor: () => undefined,
  moveCursorUp: () => undefined,
  moveCursorDown: () => undefined,
});

export const CursorProvider = (props) => {
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
    (newValue = undefined) => {
      if (newValue === undefined) {
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

  return (
    <CursorContext.Provider
      value={{
        cursor,
        isCursorLocked,
        toggleCursorLocked,
        setCursor,
        moveCursorUp,
        moveCursorDown,
      }}
    >
      {props.children}
    </CursorContext.Provider>
  );
};
