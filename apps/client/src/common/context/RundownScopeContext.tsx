import { useQueryClient } from '@tanstack/react-query';
import { MaybeString, Rundown } from 'ontime-types';
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getRundownCacheKey } from '../api/constants';
import { useProjectRundowns } from '../hooks-query/useProjectRundowns';
import { useEntryActions } from '../hooks/useEntryAction';
import { selectKeyboardScopeId, useActiveRundownScopeStore } from '../stores/activeRundownScopeStore';
import { createEventSelectionStore, type EventSelectionStoreApi } from '../stores/eventSelectionStore';
import { EntryActionsProvider } from './EntryActionsContext';

export type RundownScopeValue = {
  /** identifies this scope, two scopes may target the same rundown */
  scopeId: string;
  /** the rundown this subtree operates on */
  rundownId: string;
  /** whether this scope targets the rundown the runtime is playing */
  isLoaded: boolean;
  /** selection and cursor, scoped to this rundown */
  selectionStore: EventSelectionStoreApi;
};

const RundownScopeContext = createContext<RundownScopeValue | null>(null);

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
  const scopeId = useId();
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

  // the scope is on screen, it may own the keyboard
  useEffect(() => {
    const { register, unregister } = useActiveRundownScopeStore.getState();
    register(scopeId);
    return () => unregister(scopeId);
  }, [scopeId]);

  const value = useMemo(
    (): RundownScopeValue => ({
      scopeId,
      rundownId: targetId,
      // an unresolved target is not the loaded rundown, it is not yet any rundown
      isLoaded: Boolean(loaded) && targetId === loaded,
      selectionStore,
    }),
    [scopeId, targetId, loaded, selectionStore],
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

/** Whether this scope owns the keyboard: the scope the user last worked in, otherwise the first on screen */
export function useIsActiveRundownScope(): boolean {
  const { scopeId } = useRundownScope();
  return useActiveRundownScopeStore((state) => selectKeyboardScopeId(state) === scopeId);
}

/** Makes this scope the one the keyboard acts on */
export function useActivateRundownScope(): () => void {
  const { scopeId } = useRundownScope();
  const activate = useActiveRundownScopeStore((state) => state.activate);
  return useCallback(() => activate(scopeId), [activate, scopeId]);
}
