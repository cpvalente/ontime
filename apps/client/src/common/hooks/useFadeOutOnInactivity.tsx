import { useEffect, useState } from 'react';

import { debounce } from '../../common/utils/debounce';

export const useFadeOutOnInactivity = () => {
  const [showButton, setShowButton] = useState(false);

  // show on mouse move
  useEffect(() => {
    let fadeOut: NodeJS.Timeout | null = null;
    const setShowMenuTrue = () => {
      setShowButton(true);
      if (fadeOut) {
        clearTimeout(fadeOut);
      }
      fadeOut = setTimeout(() => setShowButton(false), 3000);
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

  return showButton;
};
