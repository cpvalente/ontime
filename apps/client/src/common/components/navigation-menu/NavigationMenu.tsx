import { memo, PropsWithChildren, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { IoApps } from '@react-icons/all-files/io5/IoApps';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';

import useClickOutside from '../../hooks/useClickOutside';
import { debounce } from '../../utils/debounce';

import style from './NavigationMenu.module.scss';

interface NavigationMenuProps {
  editCallback: () => void;
}

function NavigationMenu(props: PropsWithChildren<NavigationMenuProps>) {
  const { children, editCallback } = props;

  const [showButton, setShowButton] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(menuRef, () => onClose);

  const toggleMenu = () => (isOpen ? onClose() : onOpen());

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

  return createPortal(
    <div id='navigation-menu-portal' ref={menuRef}>
      <div className={`${style.buttonContainer} ${!showButton && !isOpen ? style.hidden : ''}`}>
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
          onClick={editCallback}
          aria-label='toggle settings'
          data-testid='navigation__toggle-settings'
        >
          <IoSettingsOutline />
        </button>
        <Drawer placement='left' onClose={onClose} isOpen={isOpen} variant='ontime' data-testid='navigation__menu'>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerHeader>
              <DrawerCloseButton size='lg' />
              Ontime
            </DrawerHeader>
            <DrawerBody padding={0}>{children}</DrawerBody>
          </DrawerContent>
        </Drawer>
      </div>
    </div>,
    document.body,
  );
}

export default memo(NavigationMenu);
