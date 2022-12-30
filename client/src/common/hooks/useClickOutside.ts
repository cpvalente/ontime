import { RefObject, useEffect } from 'react';

type ClickOutsideEventHandler = (event: MouseEvent) => void;

export default function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  callback: ClickOutsideEventHandler,
) {

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const element = ref?.current;

      // Do nothing if clicking ref's element or descendent element
      if (!element || element.contains(event.target as Node)) {
        return;
      }
      callback(event);
    }

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [ref, callback]);
}
