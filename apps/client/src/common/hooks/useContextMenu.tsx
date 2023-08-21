import { MouseEvent } from 'react';

import { Option, useContextMenuStore } from '../components/context-menu/ContextMenu';

export const useContextMenu = <T extends HTMLElement>(options: Option[]) => {
  const { setContextMenu } = useContextMenuStore();

  const localCreateContextMenu = (contextMenuEvent: MouseEvent<T, globalThis.MouseEvent>) => {
    // prevent browser default context menu from showing up
    contextMenuEvent.preventDefault();

    const { pageX, pageY } = contextMenuEvent;
    return setContextMenu({ x: pageX, y: pageY }, options);
  };

  return [localCreateContextMenu];
};
