import type { PropsWithChildren } from 'react';
import { create } from 'zustand';

import { DropdownMenuOption, PositionedDropdownMenu } from '../../../common/components/dropdown-menu/DropdownMenu';

type Position = {
  x: number;
  y: number;
};

type ContextMenuStore = {
  position: Position;
  options: DropdownMenuOption[];
  isOpen: boolean;
  setContextMenu: (position: Position, options: DropdownMenuOption[]) => void;
  setIsOpen: (newIsOpen: boolean) => void;
};

export const useContextMenuStore = create<ContextMenuStore>((set) => ({
  position: { x: 0, y: 0 },
  options: [],
  isOpen: false,
  setContextMenu: (position, options) => set(() => ({ position, options, isOpen: true })),
  setIsOpen: (newIsOpen) => set(() => ({ isOpen: newIsOpen })),
}));

export function RundownContextMenu({ children }: PropsWithChildren) {
  const { position, options, isOpen, setIsOpen } = useContextMenuStore();

  const onClose = () => {
    return setIsOpen(false);
  };

  if (!isOpen) {
    return children;
  }

  return (
    <>
      {children}
      <PositionedDropdownMenu isOpen position={position} onClose={onClose} items={options} />
    </>
  );
}
