import { memo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { useFullscreen } from '@mantine/hooks';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import { IoContract } from '@react-icons/all-files/io5/IoContract';
import { IoExpand } from '@react-icons/all-files/io5/IoExpand';
import { IoLockClosedOutline } from '@react-icons/all-files/io5/IoLockClosedOutline';
import { IoSwapVertical } from '@react-icons/all-files/io5/IoSwapVertical';

import { navigatorConstants } from '../../../viewerConfig';
import { RenameClientModal } from '../client-modal/RenameClientModal';
import useClickOutside from '../../hooks/useClickOutside';
import { setClientName } from '../../hooks/useSocket';
import { useClientStore } from '../../stores/clientStore';
import { useViewOptionsStore } from '../../stores/viewOptions';
import { isKeyEnter } from '../../utils/keyEvent';

import style from './NavigationMenu.module.scss';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavigationMenu(props: NavigationMenuProps) {
  const { isOpen, onClose } = props;

  const { id, clients } = useClientStore();

  const { isOpen: isOpenRename, onOpen: onRenameOpen, onClose: onCloseRename } = useDisclosure();
  const { fullscreen, toggle } = useFullscreen();
  const { toggleMirror } = useViewOptionsStore();

  const rename = (name: string) => {
    setClientName(name);
    onCloseRename();
  };

  const menuRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(menuRef, () => onClose);

  return createPortal(
    <div id='navigation-menu-portal' ref={menuRef}>
      <RenameClientModal onClose={onCloseRename} isOpen={isOpenRename} clients={clients} id={id} onSubmit={rename} />
      <Drawer placement='left' onClose={onClose} isOpen={isOpen} variant='ontime' data-testid='navigation__menu'>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader>
            <DrawerCloseButton size='lg' />
            Ontime
          </DrawerHeader>
          <DrawerBody padding={0}>
            <div className={style.buttonsContainer}>
              <div
                className={style.link}
                tabIndex={0}
                role='button'
                onClick={toggle}
                onKeyDown={(event) => {
                  isKeyEnter(event) && toggle();
                }}
              >
                Toggle Fullscreen
                {fullscreen ? <IoContract /> : <IoExpand />}
              </div>
              <div
                className={style.link}
                tabIndex={0}
                role='button'
                onClick={() => toggleMirror()}
                onKeyDown={(event) => {
                  isKeyEnter(event) && toggleMirror();
                }}
              >
                Flip Screen
                <IoSwapVertical />
              </div>
              <div
                className={style.link}
                tabIndex={0}
                role='button'
                onClick={onRenameOpen}
                onKeyDown={(event) => {
                  isKeyEnter(event) && onRenameOpen();
                }}
              >
                Rename Client
              </div>
            </div>
            <hr className={style.separator} />
            <Link
              to='/editor'
              className={`${style.link} ${location.pathname === '/editor' ? style.current : ''}`}
              tabIndex={0}
            >
              <IoLockClosedOutline />
              Editor
              <IoArrowUp className={style.linkIcon} />
            </Link>
            <Link
              to='/cuesheet'
              className={`${style.link} ${location.pathname === '/cuesheet' ? style.current : ''}`}
              tabIndex={0}
            >
              <IoLockClosedOutline />
              Cuesheet
              <IoArrowUp className={style.linkIcon} />
            </Link>
            <Link to='/op' className={`${style.link} ${location.pathname === '/op' ? style.current : ''}`} tabIndex={0}>
              <IoLockClosedOutline />
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
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>,
    document.body,
  );
}

export default memo(NavigationMenu);
