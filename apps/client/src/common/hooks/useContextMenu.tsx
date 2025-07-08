import { MouseEvent } from 'react';

import { useContextMenuStore } from '../../features/rundown/rundown-context-menu/RundownContextMenu';
import { DropdownMenuOption } from '../components/dropdown-menu/DropdownMenu';

export const useContextMenu = <T extends HTMLElement>(options: DropdownMenuOption[]) => {
  const setContextMenu = useContextMenuStore((state) => state.setContextMenu);

  const localCreateContextMenu = (contextMenuEvent: MouseEvent<T, globalThis.MouseEvent>) => {
    // prevent browser default context menu from showing up
    contextMenuEvent.preventDefault();

    const { pageX, pageY } = contextMenuEvent;
    return setContextMenu({ x: pageX, y: pageY }, options);
  };

  return [localCreateContextMenu];
};
