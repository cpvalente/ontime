import { create } from 'zustand';

type Anchor = { x: number; y: number };

type OpenMenu = {
  isOpen: true;
  eventId: string;
  entryIndex: number;
};

type ClosedMenu = {
  isOpen: false;
  eventId: null;
  entryIndex: null;
};

type CuesheetTableMenuStore = (OpenMenu | ClosedMenu) & {
  position: Anchor;
  openMenu: (position: Anchor, eventId: string, entryIndex: number) => void;
  closeMenu: () => void;
};

export const useCuesheetTableMenu = create<CuesheetTableMenuStore>((set) => ({
  isOpen: false,
  eventId: null,
  entryIndex: null,
  position: { x: 0, y: 0 },
  openMenu: (position: Anchor, eventId: string, entryIndex: number) =>
    set({ isOpen: true, position, eventId, entryIndex }),
  closeMenu: () => set({ isOpen: false }),
}));
