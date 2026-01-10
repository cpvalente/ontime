import { createContext, PropsWithChildren, useContext } from 'react';

import { useEntryActions } from '../hooks/useEntryAction';

type EntryActionsContextValue = ReturnType<typeof useEntryActions>;
const EntryActionsContext = createContext<EntryActionsContextValue | null>(null);

interface EntryActionsProviderProps extends PropsWithChildren {
  actions: EntryActionsContextValue;
}

export function EntryActionsProvider({ children, actions }: EntryActionsProviderProps) {
  return <EntryActionsContext.Provider value={actions}>{children}</EntryActionsContext.Provider>;
}

export function useEntryActionsContext(): EntryActionsContextValue {
  const context = useContext(EntryActionsContext);

  if (!context) {
    throw new Error('useEntryActionsContext must be used within EntryActionsProvider');
  }

  return context;
}
