import { useEffect } from 'react';

/**
 * Sets tab title
 * @param title
 */
export function useWindowTitle(title: string) {
  useEffect(() => {
    document.title = `ontime - ${title}`;
  }, []);
}
