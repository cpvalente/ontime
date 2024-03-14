import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useDisclosure } from '@chakra-ui/react';
import { useFullscreen } from '@mantine/hooks';
import { IoApps } from '@react-icons/all-files/io5/IoApps';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import { IoContract } from '@react-icons/all-files/io5/IoContract';
import { IoExpand } from '@react-icons/all-files/io5/IoExpand';
import { IoPencilSharp } from '@react-icons/all-files/io5/IoPencilSharp';
import { IoSwapVertical } from '@react-icons/all-files/io5/IoSwapVertical';

import { navigatorConstants } from '../../../viewerConfig';
import useClickOutside from '../../hooks/useClickOutside';
import { useViewOptionsStore } from '../../stores/viewOptions';
import { isKeyEnter } from '../../utils/keyEvent';

import RenameClientModal from './rename-client-modal/RenameClientModal';

import style from './NavigationMenu.module.scss';

function NavigationMenu() {
  const location = useLocation();

  const { fullscreen, toggle } = useFullscreen();
  const { toggleMirror } = useViewOptionsStore();
  const [showButton, setShowButton] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(menuRef, () => setShowMenu(false));

  const { isOpen, onOpen, onClose } = useDisclosure();

  const toggleMenu = () => setShowMenu((prev) => !prev);

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
    document.addEventListener('mousemove', setShowMenuTrue);
    return () => {
      document.removeEventListener('mousemove', setShowMenuTrue);
      if (fadeOut) {
        clearTimeout(fadeOut);
      }
    };
  }, []);

  const handleFullscreen = () => toggle();
  const handleMirror = () => toggleMirror();

  const showEditFormDrawer = () => {
    searchParams.set('edit', 'true');
    setSearchParams(searchParams);
  };

  return createPortal(
    <div id='navigation-menu-portal' ref={menuRef}>
      <RenameClientModal isOpen={isOpen} onClose={onClose} />
      <div className={`${style.buttonContainer} ${!showButton && !showMenu ? style.hidden : ''}`}>
        <button onClick={toggleMenu} aria-label='toggle menu' className={style.navButton}>
          <IoApps />
        </button>
        <button className={style.button} onClick={showEditFormDrawer}>
          <IoPencilSharp />
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
                {fullscreen ? <IoContract /> : <IoExpand />}
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
              <div
                className={style.link}
                tabIndex={0}
                role='button'
                onClick={onOpen}
                onKeyDown={(event) => {
                  isKeyEnter(event) && onOpen();
                }}
              >
                Rename Client
              </div>
            </div>
            <hr className={style.separator} />
            <Link to='/cuesheet' className={style.link} tabIndex={0}>
              Cuesheet
              <IoArrowUp className={style.linkIcon} />
            </Link>
            <Link to='/op' className={style.link} tabIndex={0}>
              Operator
              <IoArrowUp className={style.linkIcon} />
            </Link>
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
      </div>
    </div>,

    document.body,
  );
}

export default memo(NavigationMenu);
