import { memo, PropsWithChildren } from 'react';
import { IoArrowUp, IoContract, IoExpand, IoLockClosedOutline, IoSwapVertical } from 'react-icons/io5';
import { Link, useLocation } from 'react-router-dom';
import { Drawer } from '@mantine/core';
import { useDisclosure, useFullscreen } from '@mantine/hooks';

import { isLocalhost } from '../../../externals';
import { navigatorConstants } from '../../../viewerConfig';
import { useElectronEvent } from '../../hooks/useElectronEvent';
import useInfo from '../../hooks-query/useInfo';
import { useClientStore } from '../../stores/clientStore';
import { useViewOptionsStore } from '../../stores/viewOptions';
import { isKeyEnter } from '../../utils/keyEvent';
import { handleLinks, linkToOtherHost, openLink } from '../../utils/linkUtils';
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

  const [isOpenRename, handlers] = useDisclosure();
  const { fullscreen, toggle } = useFullscreen();
  const { mirror, toggleMirror } = useViewOptionsStore();
  const location = useLocation();

  return (
    <div id='navigation-menu-portal'>
      <RenameClientModal id={id} name={name} isOpen={isOpenRename} onClose={handlers.close} />
      <Drawer
        position='left'
        closeButtonProps={{ size: 'lg' }}
        size='22rem'
        title='Ontime'
        onClose={onClose}
        opened={isOpen}
        data-testid='navigation__menu'
        withinPortal
      >
        <div className={style.buttonsContainer}>
          <div
            className={cx([style.link, fullscreen && style.current])}
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
            className={cx([style.link, mirror && style.current])}
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
            onClick={handlers.open}
            onKeyDown={(event) => {
              isKeyEnter(event) && handlers.open();
            }}
          >
            Rename Client
          </div>
        </div>
        <hr className={style.separator} />
        <Link to='/editor' tabIndex={0} className={`${style.link} ${location.pathname === '/editor' && style.current}`}>
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
      </Drawer>
    </div>
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

          const address = linkToOtherHost(nif.address, currentLocation);

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
