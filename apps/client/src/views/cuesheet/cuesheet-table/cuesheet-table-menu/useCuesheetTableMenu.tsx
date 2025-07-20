import { EntryId, SupportedEntry } from 'ontime-types';
import { create } from 'zustand';

type Anchor = { x: number; y: number };

type OpenMenu = {
  isOpen: true;
  entryId: EntryId;
  entryType: SupportedEntry;
  entryIndex: number;
  parentId: EntryId | null;
  flag: boolean | null;
};

type ClosedMenu = {
  isOpen: false;
  entryId: null;
  entryType: null;
  entryIndex: null;
  parentId: null;
  flag: null;
};

type CuesheetTableMenuStore = (OpenMenu | ClosedMenu) & {
  position: Anchor;
  openMenu: (
    position: Anchor,
    entryId: EntryId,
    entryType: SupportedEntry,
    entryIndex: number,
    parentId: EntryId | null,
    flag: boolean | null,
  ) => void;
  closeMenu: () => void;
};

export const useCuesheetTableMenu = create<CuesheetTableMenuStore>((set) => ({
  isOpen: false,
  entryId: null,
  entryType: null,
  entryIndex: null,
  parentId: null,
  position: { x: 0, y: 0 },
  flag: null,
  openMenu: (
    position: Anchor,
    entryId: EntryId,
    entryType: SupportedEntry,
    entryIndex: number,
    parentId: EntryId | null,
    flag: null | boolean,
  ) => set({ isOpen: true, position, entryId, entryType, entryIndex, parentId, flag }),
  closeMenu: () => set({ isOpen: false }),
}));
