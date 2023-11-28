import { create } from 'zustand';

type ContextMenuCoords = {
  x: number;
  y: number;
};

// TODO: split value in parts so that we dont push a component
type ElementInfoStore = {
  coords: ContextMenuCoords;
  isOpen: boolean;
  value: string;
  setContextMenu: (coords: ContextMenuCoords, value: string) => void;
  setIsOpen: (newIsOpen: boolean) => void;
};

export const useElementInfoStore = create<ElementInfoStore>((set) => ({
  coords: { x: 0, y: 0 },
  options: [],
  isOpen: false,
  value: '',
  setContextMenu: (coords, value) => set(() => ({ coords, value, isOpen: true })),
  setIsOpen: (newIsOpen) => set(() => ({ isOpen: newIsOpen })),
}));

// TODO: handle move left/ <right>  </right>
export function ElementInfo() {
  const { value, coords, isOpen } = useElementInfoStore();
  console.log('debug', coords)

  return (
    <div
      style={{
        padding: '8px',
        visibility: isOpen ? 'visible' : 'hidden',
        zIndex: 10,
        background: '#000a',
        position: 'absolute',
        left: coords.x,
        top: coords.y,
      }}
    >
      {value}
    </div>
  );
}
