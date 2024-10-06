import { memo, PropsWithChildren, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
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
import useClickOutside from '../../hooks/useClickOutside';
import useElectronEvent from '../../hooks/useElectronEvent';
import { useClientStore } from '../../stores/clientStore';
import { useViewOptionsStore } from '../../stores/viewOptions';
import { isKeyEnter } from '../../utils/keyEvent';
import { handleLinks } from '../../utils/linkUtils';
import { cx } from '../../utils/styleUtils';
import { RenameClientModal } from '../client-modal/RenameClientModal';

import style from './NavigationMenu.module.scss';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavigationMenu(props: NavigationMenuProps) {
  const { isOpen, onClose } = props;

  const id = useClientStore((store) => store.id);
  const name = useClientStore((store) => store.name);

  const { isOpen: isOpenRename, onOpen: onRenameOpen, onClose: onCloseRename } = useDisclosure();
  const { fullscreen, toggle } = useFullscreen();
  const { toggleMirror } = useViewOptionsStore();
  const location = useLocation();

  const menuRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(menuRef, () => onClose);

  return createPortal(
    <div id='navigation-menu-portal' ref={menuRef}>
      <RenameClientModal id={id} name={name} isOpen={isOpenRename} onClose={onCloseRename} />
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
              tabIndex={0}
              className={`${style.link} ${location.pathname === '/editor' && style.current}`}
            >
              <IoLockClosedOutline />
              Editor
            </Link>
            <ClientLink to='cuesheet' current={location.pathname === '/cuesheet'}>
              <IoLockClosedOutline />
              Cuesheet
            </ClientLink>
            <ClientLink to='op' current={location.pathname === '/op'}>
              <IoLockClosedOutline />
              Operator
            </ClientLink>
            <hr className={style.separator} />
            {navigatorConstants.map((route) => (
              <ClientLink key={route.url} to={route.url} current={location.pathname === `/${route.url}`}>
                {route.label}
              </ClientLink>
            ))}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>,
    document.body,
  );
}

interface ClientLinkProps {
  current: boolean;
  to: string;
}

function ClientLink(props: PropsWithChildren<ClientLinkProps>) {
  const { current, to, children } = props;
  const { isElectron } = useElectronEvent();

  const classes = cx([style.link, current && style.current]);

  if (isElectron) {
    return (
      <button className={classes} tabIndex={0} onClick={(event) => handleLinks(event, to)}>
        {children}
        <IoArrowUp className={style.linkIcon} />
      </button>
    );
  }

  return (
    <Link to={`/${to}`} className={classes} tabIndex={0}>
      {children}
    </Link>
  );
}

export default memo(NavigationMenu);
