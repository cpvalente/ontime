import { createContext, PropsWithChildren, useContext } from 'react';

import { useEntryActions } from '../../../common/hooks/useEntryAction';

type EntryActionsContextValue = ReturnType<typeof useEntryActions>;
const RundownActionsContext = createContext<EntryActionsContextValue | null>(null);

interface RundownActionsProviderProps extends PropsWithChildren {
  actions: EntryActionsContextValue;
}

export function RundownActionsProvider({ children, actions }: RundownActionsProviderProps) {
  return <RundownActionsContext.Provider value={actions}>{children}</RundownActionsContext.Provider>;
}

export function useRundownEntryActions(): EntryActionsContextValue {
  const context = useContext(RundownActionsContext);

  if (!context) {
    throw new Error('useRundownEntryActions must be used within RundownActionsProvider');
  }

  return context;
}
