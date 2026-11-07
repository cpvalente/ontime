import { createContext } from 'react';

import type { EventSelectionStoreApi } from '../stores/eventSelectionStore';

export type RundownScopeValue = {
  /** the rundown this subtree operates on */
  rundownId: string;
  /** whether this scope targets the rundown the runtime is playing */
  isLoaded: boolean;
  /** selection and cursor, scoped to this rundown */
  selectionStore: EventSelectionStoreApi;
};

/**
 * The context object lives in its own module so that its identity survives hot reloads.
 * If it shared a module with the provider, an edit would create a new context
 * and consumers still holding the old one would throw outside of any provider.
 */
export const RundownScopeContext = createContext<RundownScopeValue | null>(null);
