import { useStore } from 'zustand';

import { useRundownScope } from '../../common/context/RundownScopeContext';
import type { EventSelectionStore } from '../../common/stores/eventSelectionStore';

export { getSelectionMode } from '../../common/stores/eventSelectionStore';
export type { SelectionMode } from '../../common/stores/eventSelectionStore';

/**
 * Selection and cursor for the rundown of the enclosing scope
 */
export function useEventSelection<T>(selector: (state: EventSelectionStore) => T): T {
  const { selectionStore } = useRundownScope();
  return useStore(selectionStore, selector);
}
