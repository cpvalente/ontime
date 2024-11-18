import { useEffect, useState } from 'react';
import { IoApps } from '@react-icons/all-files/io5/IoApps';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';

import { debounce } from '../../utils/debounce';

import style from './NavigationMenu.module.scss';

interface FloatingNavigationProps {
  toggleMenu: () => void;
  toggleSettings: () => void;
}

export default function FloatingNavigation(props: FloatingNavigationProps) {
  const { toggleMenu, toggleSettings } = props;
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

  return (
    <div className={`${style.buttonContainer} ${!showButton ? style.hidden : ''}`}>
      <button
        onClick={toggleMenu}
        aria-label='toggle menu'
        className={style.navButton}
        data-testid='navigation__toggle-menu'
      >
        <IoApps />
      </button>
      <button
        className={style.button}
        onClick={toggleSettings}
        aria-label='toggle settings'
        data-testid='navigation__toggle-settings'
      >
        <IoSettingsOutline />
      </button>
    </div>
  );
}
