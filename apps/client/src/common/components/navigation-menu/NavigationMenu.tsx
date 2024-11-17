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

import { isLocalhost, serverPort } from '../../../externals';
import { navigatorConstants } from '../../../viewerConfig';
import useClickOutside from '../../hooks/useClickOutside';
import { useElectronEvent } from '../../hooks/useElectronEvent';
import useInfo from '../../hooks-query/useInfo';
import { useClientStore } from '../../stores/clientStore';
import { useViewOptionsStore } from '../../stores/viewOptions';
import { isKeyEnter } from '../../utils/keyEvent';
import { handleLinks, openLink } from '../../utils/linkUtils';
import { cx } from '../../utils/styleUtils';
import { RenameClientModal } from '../client-modal/RenameClientModal';
import CopyTag from '../copy-tag/CopyTag';

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
        <DrawerContent maxWidth='22rem'>
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
            {isLocalhost && <OtherAddresses currentLocation={location.pathname} />}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>,
    document.body,
  );
}

interface OtherAddressesProps {
  currentLocation: string;
}

function OtherAddresses(props: OtherAddressesProps) {
  const { currentLocation } = props;
  const { data } = useInfo();

  // there is no point showing this if we only have one interface
  if (data.networkInterfaces.length < 2) {
    return null;
  }

  return (
    <div className={style.bottom}>
      <div className={style.sectionHeader}>Accessible on external networks</div>
      <div className={style.interfaces}>
        {data?.networkInterfaces?.map((nif) => {
          if (nif.name === 'localhost') {
            return null;
          }

          const address = `http://${nif.address}:${serverPort}${currentLocation}`;
          return (
            <CopyTag
              key={nif.name}
              copyValue={address}
              onClick={() => openLink(address)}
              label='Copy IP or navigate to address'
            >
              {nif.address} <IoArrowUp className={style.goIcon} />
            </CopyTag>
          );
        })}
      </div>
    </div>
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
