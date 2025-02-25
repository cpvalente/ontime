import { useEffect, useState } from 'react';

import { throttle } from '../utils/throttle';


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

    const throttledShowMenu = throttle(setShowMenuTrue, 1000);

    document.addEventListener('mousemove', throttledShowMenu);
    return () => {
      document.removeEventListener('mousemove', throttledShowMenu);
      if (fadeOut) {
        clearTimeout(fadeOut);
      }
    };
  }, []);

  return isMouseMoved;
};
