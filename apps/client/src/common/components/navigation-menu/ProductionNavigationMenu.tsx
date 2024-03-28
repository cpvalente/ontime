import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDisclosure } from '@chakra-ui/react';
import { useFullscreen } from '@mantine/hooks';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import { IoContract } from '@react-icons/all-files/io5/IoContract';
import { IoExpand } from '@react-icons/all-files/io5/IoExpand';

import { navigatorConstants } from '../../../viewerConfig';
import { isKeyEnter } from '../../utils/keyEvent';

import RenameClientModal from './rename-client-modal/RenameClientModal';
import NavigationMenu from './NavigationMenu';

import style from './NavigationMenu.module.scss';

interface ProductionNavigationMenuProps {
  handleSettings: () => void;
}

function ProductionNavigationMenu({ handleSettings }: ProductionNavigationMenuProps) {
  const location = useLocation();
  const { fullscreen, toggle } = useFullscreen();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <NavigationMenu editCallback={handleSettings}>
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
          onClick={onOpen}
          onKeyDown={(event) => {
            isKeyEnter(event) && onOpen();
          }}
        >
          Rename Client
        </div>
      </div>
      <hr className={style.separator} />
      <Link
        to='/editor'
        className={`${style.link} ${'/editor' === location.pathname ? style.current : ''}`}
        tabIndex={0}
      >
        Editor
        <IoArrowUp className={style.linkIcon} />
      </Link>
      <Link
        to='/cuesheet'
        className={`${style.link} ${'/cuesheet' === location.pathname ? style.current : ''}`}
        tabIndex={0}
      >
        Cuesheet
        <IoArrowUp className={style.linkIcon} />
      </Link>
      <Link to='/op' className={`${style.link} ${'/op' === location.pathname ? style.current : ''}`} tabIndex={0}>
        Operator
        <IoArrowUp className={style.linkIcon} />
      </Link>
      <hr className={style.separator} />
      {navigatorConstants.map((route) => (
        <Link
          key={route.url}
          to={route.url}
          className={`${style.link} ${route.url === location.pathname ? style.current : ''}`}
          tabIndex={0}
        >
          {route.label}
          <IoArrowUp className={style.linkIcon} />
        </Link>
      ))}
    </NavigationMenu>
  );
}

export default memo(ProductionNavigationMenu);
