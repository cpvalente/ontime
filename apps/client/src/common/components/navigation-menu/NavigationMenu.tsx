import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { IoApps } from '@react-icons/all-files/io5/IoApps';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import { IoContract } from '@react-icons/all-files/io5/IoContract';
import { IoExpand } from '@react-icons/all-files/io5/IoExpand';
import { IoSwapVertical } from '@react-icons/all-files/io5/IoSwapVertical';

import { navigatorConstants } from '../../../viewerConfig';
import useClickOutside from '../../hooks/useClickOutside';
import useFullscreen from '../../hooks/useFullscreen';
import { useKeyDown } from '../../hooks/useKeyDown';
import { useViewOptionsStore } from '../../stores/viewOptions';

import style from './NavigationMenu.module.scss';

export default function NavigationMenu() {
  const location = useLocation();

  const { isFullScreen, toggleFullScreen } = useFullscreen();
  const { mirror, toggleMirror } = useViewOptionsStore();
  const [showButton, setShowButton] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(menuRef, () => setShowMenu(false));

  const toggleMenu = () => setShowMenu((prev) => !prev);
  useKeyDown(toggleMenu, ' ');

  useEffect(() => {
    let fadeOut: NodeJS.Timeout | null = null;
    const setShowMenuTrue = () => {
      setShowButton(true);
      if (fadeOut) {
        clearTimeout(fadeOut);
      }
      fadeOut = setTimeout(() => setShowButton(false), 3000);
    };
    document.addEventListener('mousemove', setShowMenuTrue);
    return () => {
      document.removeEventListener('mousemove', setShowMenuTrue);
      if (fadeOut) {
        clearTimeout(fadeOut);
      }
    };
  }, []);

  const isKeyEnter = (event: KeyboardEvent<HTMLDivElement>) => event.key === 'Enter';
  const handleFullscreen = () => toggleFullScreen();
  const handleMirror = () => toggleMirror();

  return createPortal(
    <div id='navigation-menu-portal' ref={menuRef} className={mirror ? style.mirror : ''}>
      <button
        onClick={toggleMenu}
        aria-label='toggle menu'
        className={`${style.navButton} ${!showButton && !showMenu ? style.hidden : ''}`}
      >
        <IoApps />
      </button>

      {showMenu && (
        <div className={style.menuContainer} data-testid='navigation-menu'>
          <div className={style.buttonsContainer}>
            <div
              className={style.link}
              tabIndex={0}
              role='button'
              onClick={handleFullscreen}
              onKeyDown={(event) => {
                isKeyEnter(event) && handleFullscreen();
              }}
            >
              Toggle Fullscreen
              {isFullScreen ? <IoContract /> : <IoExpand />}
            </div>
            <div
              className={style.link}
              tabIndex={0}
              role='button'
              onClick={handleMirror}
              onKeyDown={(event) => {
                isKeyEnter(event) && handleMirror();
              }}
            >
              Flip Screen
              <IoSwapVertical />
            </div>
            {/*<div className={style.link} tabIndex={0}>*/}
            {/*  Rename Client*/}
            {/*</div>*/}
          </div>
          <hr className={style.separator} />
          {navigatorConstants.map((route) => (
            <Link
              key={route.url}
              to={route.url}
              className={`${style.link} ${route.url === location.pathname ? style.current : undefined}`}
              tabIndex={0}
            >
              {route.label}
              <IoArrowUp className={style.linkIcon} />
            </Link>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
