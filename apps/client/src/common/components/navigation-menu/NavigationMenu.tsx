import { KeyboardEvent, memo, useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  useBoolean,
  useDisclosure,
} from '@chakra-ui/react';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useDraggable, useSensor, useSensors } from '@dnd-kit/core';
import { Coordinates, CSS, Transform } from '@dnd-kit/utilities';
import { IoApps } from '@react-icons/all-files/io5/IoApps';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import { IoContract } from '@react-icons/all-files/io5/IoContract';
import { IoExpand } from '@react-icons/all-files/io5/IoExpand';
import { IoPencilSharp } from '@react-icons/all-files/io5/IoPencilSharp';
import { IoRefreshSharp } from '@react-icons/all-files/io5/IoRefreshSharp';
import { IoSwapVertical } from '@react-icons/all-files/io5/IoSwapVertical';
import { MdDragHandle } from '@react-icons/all-files/md/MdDragHandle';

import { navigatorConstants } from '../../../viewerConfig';
import useFullscreen from '../../hooks/useFullscreen';
import { useViewOptionsStore } from '../../stores/viewOptions';

import RenameClientModal from './rename-client-modal/RenameClientModal';

import style from './NavigationMenu.module.scss';

const defaultCoordinates: Coordinates = { x: 0, y: 0 };

const getTransformDimensions = (transform: Transform | null, isMirrored: boolean) => {
  if (isMirrored && transform) {
    const { x, y, ...rest } = transform;

    const mirroredTransform: Transform = {
      ...rest,
      x: x - x * 2,
      y: y - y * 2,
    };

    return CSS.Transform.toString(mirroredTransform);
  }

  return CSS.Transform.toString(transform);
};

function NavigationMenuDragContext() {
  const [{ x, y }, setCoordinates] = useState<Coordinates>(defaultCoordinates);
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));
  const { mirror: isMirrored, toggleMirror } = useViewOptionsStore();

  const onDragEnd = ({ delta }: DragEndEvent) => {
    if (isMirrored) {
      return setCoordinates(({ x, y }) => ({
        x: x - delta.x,
        y: y - delta.y,
      }));
    }

    return setCoordinates(({ x, y }) => ({
      x: x + delta.x,
      y: y + delta.y,
    }));
  };

  const toggleIsMirrored = () => {
    toggleMirror();
  };

  const onResetMenuCoordinates = () => {
    setCoordinates(defaultCoordinates);
  };

  return (
    <DndContext id='navigation-menu' onDragEnd={onDragEnd} sensors={sensors}>
      <NavigationMenu
        top={y}
        left={x}
        isMirrored={isMirrored}
        toggleIsMirrored={toggleIsMirrored}
        onResetMenuCoordinates={onResetMenuCoordinates}
      />
    </DndContext>
  );
}
interface NavigationMenuProps {
  top: number;
  left: number;
  isMirrored: boolean;
  toggleIsMirrored: () => void;
  onResetMenuCoordinates: () => void;
}

function NavigationMenu({ top, left, isMirrored, toggleIsMirrored, onResetMenuCoordinates }: NavigationMenuProps) {
  const location = useLocation();

  const { isFullScreen, toggleFullScreen } = useFullscreen();
  const [buttons, setButtons] = useBoolean();
  const [searchParams, setSearchParams] = useSearchParams();
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
    id: 'navigation-menu',
  });

  const { isOpen: isRCModalOpen, onOpen: onRCModalOpen, onClose: onRCModalClose } = useDisclosure();
  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();

  // show on mouse move
  useEffect(() => {
    let fadeOut: NodeJS.Timeout | null = null;
    const setShowMenuTrue = () => {
      setButtons.on();
      if (fadeOut) {
        clearTimeout(fadeOut);
      }
      fadeOut = setTimeout(() => {
        setButtons.off();
        onMenuClose();
      }, 3000);
    };
    document.addEventListener('mousemove', setShowMenuTrue);
    return () => {
      document.removeEventListener('mousemove', setShowMenuTrue);
      if (fadeOut) {
        clearTimeout(fadeOut);
      }
    };
  }, [onMenuClose, setButtons]);

  const isKeyEnter = (event: KeyboardEvent<HTMLDivElement>) => event.key === 'Enter';

  const showEditFormDrawer = () => {
    searchParams.set('edit', 'true');
    setSearchParams(searchParams);
  };

  return (
    <div id='navigation-menu-portal'>
      <RenameClientModal isOpen={isRCModalOpen} onClose={onRCModalClose} />
      <Popover placement='auto-start' isOpen={isMenuOpen} onOpen={onMenuOpen} onClose={onMenuClose}>
        <div
          className={`${style.buttonContainer} ${!buttons ? style.hidden : ''}`}
          ref={setNodeRef}
          style={{ top, left, transform: getTransformDimensions(transform, isMirrored) }}
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
                onClick={onResetMenuCoordinates}
                onKeyDown={(event) => {
                  isKeyEnter(event) && onResetMenuCoordinates();
                }}
              >
                Reset Menu
                <IoRefreshSharp />
              </div>
              <div
                className={style.link}
                tabIndex={0}
                role='button'
                onClick={onRCModalOpen}
                onKeyDown={(event) => {
                  isKeyEnter(event) && onRCModalOpen();
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
