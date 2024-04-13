import { useEffect, useRef } from 'react';

export default function useScrollIntoView<T extends HTMLElement>(name: string, location?: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (location && ref.current) {
      if (location === name) {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [location, name]);

  return ref;
}
