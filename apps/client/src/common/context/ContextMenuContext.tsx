// logic (with some modifications) culled from:
// https://github.com/lukasbach/chakra-ui-contextmenu/blob/main/src/ContextMenu.tsx

import { createContext, ReactNode, useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { IconType } from '@react-icons/all-files';

import style from './ContextMenuContext.module.scss';

type ContextMenuCoords = {
  x: number;
  y: number;
};

type ContextMenuContextType = {
  createContextMenu: (options: Option[], menuCoordinates: ContextMenuCoords) => void;
};

export const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export type Option = {
  label: string;
  icon: IconType;
  onClick: () => void;
};

interface ContextMenuProviderProps {
  children: ReactNode;
}

export const ContextMenuProvider = ({ children }: ContextMenuProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const [coords, setCoords] = useState<ContextMenuCoords>({ x: 0, y: 0 });
  const [options, setOptions] = useState<Option[]>([]);

  const onClose = () => {
    return setIsOpen(false);
  };

  const createContextMenu = (options: Option[], menuCoords: ContextMenuCoords) => {
    setCoords(menuCoords);
    setOptions(options);
    setIsOpen(true);
  };

  return (
    <ContextMenuContext.Provider value={{ createContextMenu }}>
      {children}
      {isOpen && (
        <>
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
      )}
    </ContextMenuContext.Provider>
  );
};
