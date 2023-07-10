// logic (with some modifications) culled from:
// https://github.com/lukasbach/chakra-ui-contextmenu/blob/main/src/ContextMenu.tsx

import { ReactElement } from 'react';
import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { IconType } from '@react-icons/all-files';
import { create } from 'zustand';

import style from './ContextMenu.module.scss';

type ContextMenuCoords = {
  x: number;
  y: number;
};

export type Option = {
  label: string;
  icon: IconType;
  onClick: () => void;
};

type ContextMenuStore = {
  coords: ContextMenuCoords;
  options: Option[];
  isOpen: boolean;
  setContextMenu: (coords: ContextMenuCoords, options: Option[]) => void;
  setIsOpen: (newIsOpen: boolean) => void;
};

export const useContextMenuStore = create<ContextMenuStore>((set) => ({
  coords: { x: 0, y: 0 },
  options: [],
  isOpen: false,
  setContextMenu: (coords, options) => set(() => ({ coords, options, isOpen: true })),
  setIsOpen: (newIsOpen) => set(() => ({ isOpen: newIsOpen })),
}));

interface ContextMenuProps {
  // ReactElement type required due to early `return` (line 51) returning {children}
  children: ReactElement;
}

export const ContextMenu = ({ children }: ContextMenuProps) => {
  const { coords, options, isOpen, setIsOpen } = useContextMenuStore();

  const onClose = () => {
    return setIsOpen(false);
  };

  if (!isOpen) {
    return children;
  }

  return (
    <>
      {children}
      <div className={style.contextMenuBackdrop} />
      <Menu isOpen gutter={0} onClose={onClose} isLazy lazyBehavior='unmount' variant='ontime-on-dark'>
        <MenuButton
          className={style.contextMenuButton}
          aria-hidden
          w={1}
          h={1}
          style={{
            left: coords.x,
            top: coords.y,
          }}
        />
        <MenuList>
          {options.map(({ label, icon: Icon, onClick }, i) => (
            <MenuItem key={i} icon={<Icon />} onClick={onClick}>
              {label}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </>
  );
};
