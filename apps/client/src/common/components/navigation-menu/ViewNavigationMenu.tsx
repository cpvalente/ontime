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

function ViewNavigationMenu() {
  const location = useLocation();
  const { fullscreen, toggle } = useFullscreen();
  const { toggleMirror } = useViewOptionsStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const showEditFormDrawer = useCallback(() => {
    searchParams.set('edit', 'true');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  return (
    <NavigationMenu editCallback={showEditFormDrawer}>
      <RenameClientModal isOpen={isOpen} onClose={onClose} />
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
    </NavigationMenu>
  );
}

export default memo(ViewNavigationMenu);
