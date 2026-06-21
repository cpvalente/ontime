import { PropsWithChildren, createContext, useContext } from 'react';

import { useEntryActions, useScopedEntryActions } from '../hooks/useEntryAction';
import { useRundownSelectionContext } from './RundownSelectionContext';

type EntryActionsContextValue = ReturnType<typeof useEntryActions>;
const EntryActionsContext = createContext<EntryActionsContextValue | null>(null);

export function EntryActionsProvider({ children }: PropsWithChildren) {
  const { effectiveRundownId } = useRundownSelectionContext();
  const actions = useScopedEntryActions(effectiveRundownId);

  return <EntryActionsContext.Provider value={actions}>{children}</EntryActionsContext.Provider>;
}

export function useEntryActionsContext(): EntryActionsContextValue {
  const context = useContext(EntryActionsContext);

  if (!context) {
    throw new Error('useEntryActionsContext must be used within EntryActionsProvider');
  }

  return context;
}
