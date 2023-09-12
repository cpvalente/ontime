// roughly from https://github.com/juliencrn/usehooks-ts/blob/master/packages/usehooks-ts/src/useMediaQuery/useMediaQuery.ts

import { useCallback, useEffect, useState } from 'react';

function getMatches(query: string): boolean {
  return window.matchMedia(query).matches;
}

// TODO: debounce handleChange
export default function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(getMatches(query));

  const handleChange = useCallback(() => {
    setMatches(getMatches(query));
  }, [query]);

  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    // Triggered at the first client-side load and if query changes
    handleChange();

    // Listen matchMedia
    matchMedia.addEventListener('change', handleChange);

    return () => {
      matchMedia.removeEventListener('change', handleChange);
    };
  }, [handleChange, query]);

  return matches;
}
