import { Rundown } from 'ontime-types';
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef } from 'react';

import { getRundownQueryKey } from '../api/constants';
import { useProjectRundowns } from '../hooks-query/useProjectRundowns';
import { ontimeQueryClient } from '../queryClient';
import { createEventSelectionStore, type EventSelectionStoreApi } from '../stores/eventSelectionStore';

export type RundownScopeValue = {
  /** the rundown this subtree operates on */
  rundownId: string;
  /** whether this scope targets the rundown the runtime is playing */
  isLoaded: boolean;
  /** selection and cursor, scoped to this rundown */
  selectionStore: EventSelectionStoreApi;
};

const RundownScopeContext = createContext<RundownScopeValue | null>(null);

export interface RundownScopeProviderProps extends PropsWithChildren {
  /** rundown to operate on, null follows the loaded rundown */
  rundownId: string | null;
}

/**
 * Declares which rundown a subtree reads from.
 *
 * Data hooks resolve their rundown from here, so components never need to know
 * which rundown they operate on. Nest a provider to point part of the tree at a
 * different rundown; the app mounts one at the root that follows the loaded rundown.
 */
export function RundownScopeProvider({ children, rundownId }: RundownScopeProviderProps) {
  const {
    data: { loaded },
  } = useProjectRundowns();

  const targetId = rundownId ?? loaded;

  // the store reads the rundown lazily, the ref keeps it pointing at the current target
  const targetIdRef = useRef(targetId);
  targetIdRef.current = targetId;

  const selectionStoreRef = useRef<EventSelectionStoreApi | null>(null);
  if (selectionStoreRef.current === null) {
    selectionStoreRef.current = createEventSelectionStore(() =>
      ontimeQueryClient.getQueryData<Rundown>(getRundownQueryKey(targetIdRef.current)),
    );
  }
  const selectionStore = selectionStoreRef.current;

  // a selection refers to entries of a single rundown, it cannot survive a change of target
  useEffect(() => {
    selectionStore.getState().clearSelectedEvents();
  }, [selectionStore, targetId]);

  const value = useMemo(
    (): RundownScopeValue => ({
      rundownId: targetId,
      isLoaded: targetId === loaded,
      selectionStore,
    }),
    [targetId, loaded, selectionStore],
  );

  return <RundownScopeContext.Provider value={value}>{children}</RundownScopeContext.Provider>;
}

export function useRundownScope(): RundownScopeValue {
  const context = useContext(RundownScopeContext);

  if (!context) {
    throw new Error('useRundownScope must be used within a RundownScopeProvider');
  }

  return context;
}
