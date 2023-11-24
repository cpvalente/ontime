import { Tooltip } from '@chakra-ui/react';
import { create } from 'zustand';

type ContextMenuCoords = {
  x: number;
  y: number;
};

type ElementInfoStore = {
  coords: ContextMenuCoords;
  isOpen: boolean;
  value: string;
  setContextMenu: (coords: ContextMenuCoords, value: string) => void;
  setIsOpen: (newIsOpen: boolean) => void;
};

export const useElementInfoSt9re = create<ElementInfoStore>((set) => ({
  coords: { x: 0, y: 0 },
  options: [],
  isOpen: false,
  value: "",
  setContextMenu: (coords, value) => set(() => ({ coords, value, isOpen: true })),
  setIsOpen: (newIsOpen) => set(() => ({ isOpen: newIsOpen })),
}));
