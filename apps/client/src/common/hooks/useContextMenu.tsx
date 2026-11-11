import { MouseEvent, useCallback } from 'react';

import { useContextMenuStore } from '../../features/rundown/rundown-context-menu/RundownContextMenu';
import { DropdownMenuOption } from '../components/dropdown-menu/DropdownMenu';
import { useRundownScope } from '../context/RundownScopeContext';

type ContextMenuOptions = () => DropdownMenuOption[];

export const useContextMenu = <T extends HTMLElement>(options: ContextMenuOptions) => {
  const setContextMenu = useContextMenuStore((state) => state.setContextMenu);
  const { scopeId } = useRundownScope();

  const localCreateContextMenu = useCallback(
    (contextMenuEvent: MouseEvent<T, globalThis.MouseEvent>) => {
      // prevent browser default context menu from showing up
      contextMenuEvent.preventDefault();

      const { pageX, pageY } = contextMenuEvent;
      const menuOptions = options();
      return setContextMenu({ x: pageX, y: pageY }, menuOptions, scopeId);
    },
    [options, setContextMenu, scopeId],
  );

  return [localCreateContextMenu];
};
