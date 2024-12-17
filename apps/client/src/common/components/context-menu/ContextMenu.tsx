// logic (with some modifications) culled from:
// https://github.com/lukasbach/chakra-ui-contextmenu/blob/main/src/ContextMenu.tsx

import { ReactElement } from 'react';
import { IconType } from '@react-icons/all-files';
import { create } from 'zustand';

import { Button } from '../../../components/ui/button';
import { MenuContent, MenuItemGroup, MenuRoot, MenuTrigger } from '../../../components/ui/menu';

import { ContextMenuOption } from './ContextMenuOption';

import style from './ContextMenu.module.scss';

type ContextMenuCoords = {
  x: number;
  y: number;
};

export type OptionWithoutGroup = {
  label: string;
  isDisabled?: boolean;
  icon: IconType;
  onClick: () => void;
  withDivider?: boolean;
};

export type OptionWithGroup = {
  label: string;
  group: Omit<OptionWithoutGroup, 'isGroup'>[];
};

export type Option = OptionWithoutGroup | OptionWithGroup;

const isOptionWithGroup = (option: Option): option is OptionWithGroup => 'group' in option;

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
      <MenuRoot isOpen size='sm' gutter={0} onClose={onClose} isLazy lazyBehavior='unmount' variant='ontime-on-dark'>
        <MenuTrigger asChild>
          <Button
            className={style.contextMenuButton}
            aria-hidden
            w={1}
            h={1}
            style={{
              position: 'fixed',
              left: coords.x,
              top: coords.y,
            }}
          />
        </MenuTrigger>

        <MenuContent>
          {options.map((option) =>
            isOptionWithGroup(option) ? (
              <MenuItemGroup key={option.label} title={option.label}>
                {option.group.map((groupOption) => (
                  <ContextMenuOption key={groupOption.label} {...groupOption} />
                ))}
              </MenuItemGroup>
            ) : (
              <ContextMenuOption key={option.label} {...option} />
            ),
          )}
        </MenuContent>
      </MenuRoot>
    </>
  );
};
