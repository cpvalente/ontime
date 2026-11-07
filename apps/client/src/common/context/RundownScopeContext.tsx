import { useQueryClient } from '@tanstack/react-query';
import { MaybeString, Rundown } from 'ontime-types';
import { PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getRundownCacheKey } from '../api/constants';
import { useProjectRundowns } from '../hooks-query/useProjectRundowns';
import { useEntryActions } from '../hooks/useEntryAction';
import { createEventSelectionStore } from '../stores/eventSelectionStore';
import { EntryActionsProvider } from './EntryActionsContext';
import { RundownScopeContext, type RundownScopeValue } from './rundownScope.context';

export type { RundownScopeValue };

interface RundownScopeProviderProps extends PropsWithChildren {
  /** rundown to operate on, null follows the loaded rundown */
  rundownId: MaybeString;
}

/**
 * Declares which rundown an editing surface works on.
 *
 * Data, selection and entry actions all resolve their rundown from here,
 * so components never need to know which rundown they operate on,
 * and data and actions cannot disagree.
 */
export function RundownScopeProvider({ children, rundownId }: RundownScopeProviderProps) {
  const queryClient = useQueryClient();
  const {
    data: { loaded },
  } = useProjectRundowns();

  const targetId = rundownId ?? loaded;

  // the store reads the rundown lazily, the ref keeps it pointing at the current target
  const targetIdRef = useRef(targetId);

  const [selectionStore] = useState(() =>
    createEventSelectionStore(() => queryClient.getQueryData<Rundown>(getRundownCacheKey(targetIdRef.current))),
  );

  // a selection refers to entries of a single rundown, it cannot survive a change of target
  useEffect(() => {
    targetIdRef.current = targetId;
    selectionStore.getState().clearSelectedEvents();
  }, [selectionStore, targetId]);

  const value = useMemo(
    (): RundownScopeValue => ({
      rundownId: targetId,
      // an unresolved target is not the loaded rundown, it is not yet any rundown
      isLoaded: Boolean(loaded) && targetId === loaded,
      selectionStore,
    }),
    [targetId, loaded, selectionStore],
  );

  const actions = useEntryActions(targetId);

  return (
    <RundownScopeContext.Provider value={value}>
      <EntryActionsProvider actions={actions}>{children}</EntryActionsProvider>
    </RundownScopeContext.Provider>
  );
}

export function useRundownScope(): RundownScopeValue {
  const context = useContext(RundownScopeContext);

  if (!context) {
    throw new Error('useRundownScope must be used within a RundownScopeProvider');
  }

  return context;
}
