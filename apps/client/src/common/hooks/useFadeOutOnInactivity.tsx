import { useEffect, useState } from 'react';

import { debounce } from '../../common/utils/debounce';

export const useFadeOutOnInactivity = () => {
  const [isMouseMoved, setIsMouseMoved] = useState(false);

  // show on mouse move
  useEffect(() => {
    let fadeOut: NodeJS.Timeout | null = null;
    const setShowMenuTrue = () => {
      setIsMouseMoved(true);
      if (fadeOut) {
        clearTimeout(fadeOut);
      }
      fadeOut = setTimeout(() => setIsMouseMoved(false), 3000);
    };

    const debouncedShowMenu = debounce(setShowMenuTrue, 1000);

    document.addEventListener('mousemove', debouncedShowMenu);
    return () => {
      document.removeEventListener('mousemove', debouncedShowMenu);
      if (fadeOut) {
        clearTimeout(fadeOut);
      }
    };
  }, []);

  return isMouseMoved;
};
