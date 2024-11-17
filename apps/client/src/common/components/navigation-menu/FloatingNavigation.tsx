import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IoApps } from '@react-icons/all-files/io5/IoApps';
import { IoLockClosedOutline } from '@react-icons/all-files/io5/IoLockClosedOutline';
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
  const [searchParams] = useSearchParams();

  const isViewLocked = searchParams.get('locked') ? true : false;

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
      {isViewLocked ? (
        <div className={style.lockIcon}>
          <IoLockClosedOutline />
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
