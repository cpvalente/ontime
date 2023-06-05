import { useCallback, useEffect } from 'react';

type UseKeyDown = (callback: () => void, targetKey: string, options?: { isDisabled?: boolean }) => void;

export const useKeyDown: UseKeyDown = (callback, targetKey, options = {}) => {
  const { isDisabled = false } = options;

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const targetKeyPressed = event.key === targetKey && !event.repeat;
      if (targetKeyPressed && !isDisabled) {
        event.preventDefault();
        callback();
      }
    },
    [callback, isDisabled, targetKey],
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);
};
