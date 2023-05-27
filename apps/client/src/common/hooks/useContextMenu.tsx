import { MouseEvent, useContext } from 'react';

import { ContextMenuContext, Option } from '../context/ContextMenuContext';

export const useContextMenu = <T extends HTMLElement>(options: Option[]) => {
  const contextMenuContext = useContext(ContextMenuContext);

  if (contextMenuContext === null) {
    throw new Error('useContextMenu should be wrapped by ContextMenuProvider');
  }

  const { createContextMenu } = contextMenuContext;

  const localCreateContextMenu = (contextMenuEvent: MouseEvent<T, globalThis.MouseEvent>) => {
    // prevent browser default context menu from showing up
    contextMenuEvent.preventDefault();

    const { pageX, pageY } = contextMenuEvent;
    return createContextMenu(options, { x: pageX, y: pageY });
  };

  return [localCreateContextMenu];
};
