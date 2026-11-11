import { create } from 'zustand';

import { DropdownMenuOption, PositionedDropdownMenu } from '../../../common/components/dropdown-menu/DropdownMenu';
import { useRundownScope } from '../../../common/context/RundownScopeContext';

type Position = {
  x: number;
  y: number;
};

type ContextMenuStore = {
  position: Position;
  options: DropdownMenuOption[];
  isOpen: boolean;
  /** the scope which opened the menu, each rundown on screen mounts its own */
  scopeId: string | null;
  setContextMenu: (position: Position, options: DropdownMenuOption[], scopeId: string) => void;
  setIsOpen: (newIsOpen: boolean) => void;
};

export const useContextMenuStore = create<ContextMenuStore>((set) => ({
  position: { x: 0, y: 0 },
  options: [],
  isOpen: false,
  scopeId: null,
  setContextMenu: (position, options, scopeId) => set(() => ({ position, options, isOpen: true, scopeId })),
  setIsOpen: (newIsOpen) => set(() => ({ isOpen: newIsOpen })),
}));

export function RundownContextMenu() {
  const { position, options, isOpen, scopeId: menuScopeId, setIsOpen } = useContextMenuStore();
  const { scopeId } = useRundownScope();

  const onClose = () => {
    return setIsOpen(false);
  };

  if (!isOpen || menuScopeId !== scopeId) {
    return null;
  }

  return <PositionedDropdownMenu isOpen position={position} onClose={onClose} items={options} />;
}
