import { createContext, useCallback, useState } from 'react';

export const CursorContext = createContext({
  cursor: 0,
  isCursorLocked: false,

  setCursor: () => undefined,
  moveCursorUp: () => undefined,
  moveCursorDown: () => undefined,
});

export const CursorProvider = (props) => {
  const [cursor, setCursor] = useState(0)
  // const isCursorLocked = useAtom(useMemo(() => SelectSetting('cursor') === 'locked', []));

  const isCursorLocked = false;
  const moveCursorUp = useCallback(() => {
    setCursor((prev) => Math.min(prev - 1, 0));
  }, []);

  const moveCursorDown = useCallback(() => {
    // else if (cursor < events.length - 1) setCursor(cursor + 1);
    setCursor((prev) => prev + 1);
  }, []);


  return (
    <CursorContext.Provider
      value={{ cursor, isCursorLocked, setCursor, moveCursorUp, moveCursorDown }}>
      {props.children}
    </CursorContext.Provider>
  );
};
