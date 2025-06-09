import { useEffect, useState } from 'react';

import { throttle } from '../utils/throttle';

const inactiveTime = 3000; // 3 seconds

/**
 * Provides whether there has been mouse movement in the page in the last <inactiveTime>
 */
export const useFadeOutOnInactivity = (initialState = false) => {
  const [isUserActive, setIsUserActive] = useState(initialState);

  // show on mouse move
  useEffect(() => {
    let fadeOut: NodeJS.Timeout | null = null;
    const setShowMenuTrue = () => {
      setIsUserActive(true);
      if (fadeOut) {
        clearTimeout(fadeOut);
      }
      fadeOut = setTimeout(() => setIsUserActive(false), inactiveTime);
    };

    const throttledShowMenu = throttle(setShowMenuTrue, 1000);

    document.addEventListener('mousemove', throttledShowMenu);
    document.addEventListener('keydown', throttledShowMenu);

    return () => {
      document.removeEventListener('mousemove', throttledShowMenu);
      document.removeEventListener('keydown', throttledShowMenu);
      if (fadeOut) {
        clearTimeout(fadeOut);
      }
    };
  }, []);

  return isUserActive;
};
