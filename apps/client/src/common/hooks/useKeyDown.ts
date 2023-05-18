import { useEffect } from 'react';

export const useKeyDown = (callback: () => void, targetKey: string) => {
  const onKeyDown = (event: KeyboardEvent) => {
    const targetKeyPressed = event.key === targetKey && !event.repeat;
    if (targetKeyPressed) {
      event.preventDefault();
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);
};
