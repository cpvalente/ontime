import { memo, useCallback } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useDisclosure } from '@chakra-ui/react';
import { useFullscreen } from '@mantine/hooks';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import { IoContract } from '@react-icons/all-files/io5/IoContract';
import { IoExpand } from '@react-icons/all-files/io5/IoExpand';
import { IoSwapVertical } from '@react-icons/all-files/io5/IoSwapVertical';

import { navigatorConstants } from '../../../viewerConfig';
import { useViewOptionsStore } from '../../stores/viewOptions';
import { isKeyEnter } from '../../utils/keyEvent';

import RenameClientModal from './rename-client-modal/RenameClientModal';
import NavigationMenu from './NavigationMenu';

import style from './NavigationMenu.module.scss';
import FloatingNavigation from './FloatingNavigation';

function ViewNavigationMenu() {
  const location = useLocation();
  const { fullscreen, toggle } = useFullscreen();
  const { toggleMirror } = useViewOptionsStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen: isRenameOpen, onOpen: onRenameOpen, onClose: onRenameClose } = useDisclosure();
  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();

  const showEditFormDrawer = useCallback(() => {
    searchParams.set('edit', 'true');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const toggleMenu = () => (isMenuOpen ? onMenuClose() : onMenuOpen());

  return (
    <>
      <FloatingNavigation toggleMenu={toggleMenu} toggleSettings={showEditFormDrawer} />
      <NavigationMenu isOpen={isMenuOpen} onClose={onMenuClose}>
        <RenameClientModal isOpen={isRenameOpen} onClose={onRenameClose} />
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
      </NavigationMenu>
    </>
  );
}

export default memo(ViewNavigationMenu);
