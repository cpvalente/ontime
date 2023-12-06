import { KeyboardEvent, memo, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Popover, PopoverBody, PopoverContent, PopoverTrigger, Portal, useDisclosure } from '@chakra-ui/react';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useDraggable, useSensor, useSensors } from '@dnd-kit/core';
import { Coordinates, CSS } from '@dnd-kit/utilities';
import { IoApps } from '@react-icons/all-files/io5/IoApps';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import { IoContract } from '@react-icons/all-files/io5/IoContract';
import { IoExpand } from '@react-icons/all-files/io5/IoExpand';
import { IoPencilSharp } from '@react-icons/all-files/io5/IoPencilSharp';
import { IoSwapVertical } from '@react-icons/all-files/io5/IoSwapVertical';
import { MdDragHandle } from '@react-icons/all-files/md/MdDragHandle';

import { navigatorConstants } from '../../../viewerConfig';
import useClickOutside from '../../hooks/useClickOutside';
import useFullscreen from '../../hooks/useFullscreen';
import { useViewOptionsStore } from '../../stores/viewOptions';

import RenameClientModal from './rename-client-modal/RenameClientModal';

import style from './NavigationMenu.module.scss';

function NavigationMenuDragContext() {
  const [{ x, y }, setCoordinates] = useState<Coordinates>({ x: 0, y: 0 });
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));
  const { mirror: isMirrored, toggleMirror } = useViewOptionsStore();

  const onDragEnd = ({ delta }: DragEndEvent) => {
    return setCoordinates(({ x, y }) => ({
      x: x + delta.x,
      y: y + delta.y,
    }));
  };

  const toggleIsMirrored = () => toggleMirror();

  return (
    <DndContext id='navigation-menu' onDragEnd={onDragEnd} sensors={sensors}>
      <NavigationMenu top={y} left={x} isMirrored={isMirrored} toggleIsMirrored={toggleIsMirrored} />
    </DndContext>
  );
}
interface NavigationMenuProps {
  top: number;
  left: number;
  isMirrored: boolean;
  toggleIsMirrored: () => void;
}

function NavigationMenu({ top, left, isMirrored, toggleIsMirrored }: NavigationMenuProps) {
  const location = useLocation();

  const { isFullScreen, toggleFullScreen } = useFullscreen();
  const [showButton, setShowButton] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
    id: 'navigation-menu',
  });

  useClickOutside(menuRef, () => setShowMenu(false));

  const { isOpen, onOpen, onClose } = useDisclosure();

  // show on mouse move
  useEffect(() => {
    let fadeOut: NodeJS.Timeout | null = null;
    const setShowMenuTrue = () => {
      setShowButton(true);
      if (fadeOut) {
        clearTimeout(fadeOut);
      }
      fadeOut = setTimeout(() => setShowButton(true), 3000);
    };
    document.addEventListener('mousemove', setShowMenuTrue);
    return () => {
      document.removeEventListener('mousemove', setShowMenuTrue);
      if (fadeOut) {
        clearTimeout(fadeOut);
      }
    };
  }, []);

  const isKeyEnter = (event: KeyboardEvent<HTMLDivElement>) => event.key === 'Enter';

  const showEditFormDrawer = () => {
    searchParams.set('edit', 'true');
    setSearchParams(searchParams);
  };

  return (
    <div id='navigation-menu-portal' ref={menuRef}>
      <RenameClientModal isOpen={isOpen} onClose={onClose} />
      <Popover placement='auto-start'>
        <div
          className={`${style.buttonContainer} ${!showButton && !showMenu ? style.hidden : ''}`}
          ref={setNodeRef}
          style={{ top, left, transform: CSS.Translate.toString(transform) }}
        >
          <PopoverTrigger>
            <button aria-label='toggle menu' className={style.navButton}>
              <IoApps />
            </button>
          </PopoverTrigger>
          <button className={style.button} onClick={showEditFormDrawer}>
            <IoPencilSharp />
          </button>
          <button
            className={`${style.grabBtn} ${isDragging ? style.grabbing : style.grab}`}
            {...attributes}
            {...listeners}
          >
            <MdDragHandle />
          </button>
        </div>
        <Portal>
          <PopoverContent border='none' w='200px'>
            <PopoverBody
              className={`${style.menuContainer} ${isMirrored ? style.mirror : ''}`}
              data-testid='navigation-menu'
              p={0}
            >
              <div
                className={style.link}
                tabIndex={0}
                role='button'
                onClick={toggleFullScreen}
                onKeyDown={(event) => {
                  isKeyEnter(event) && toggleFullScreen();
                }}
              >
                Toggle Fullscreen
                {isFullScreen ? <IoContract /> : <IoExpand />}
              </div>
              <div
                className={style.link}
                tabIndex={0}
                role='button'
                onClick={toggleIsMirrored}
                onKeyDown={(event) => {
                  isKeyEnter(event) && toggleIsMirrored();
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
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>
    </div>
  );
}

export default memo(NavigationMenuDragContext);
