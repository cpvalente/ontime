import { memo, PropsWithChildren, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay } from '@chakra-ui/react';

import useClickOutside from '../../hooks/useClickOutside';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavigationMenu(props: PropsWithChildren<NavigationMenuProps>) {
  const { children, isOpen, onClose } = props;

  const menuRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(menuRef, () => onClose);

  return createPortal(
    <div id='navigation-menu-portal' ref={menuRef}>
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
    </div>,
    document.body,
  );
}

export default memo(NavigationMenu);
