import { PropsWithChildren } from 'react';

import { useScopedEntryActions } from '../hooks/useEntryAction';
import { EntryActionsProvider } from './EntryActionsContext';
import { RundownScopeProvider, useRundownScope, type RundownScopeProviderProps } from './RundownScopeContext';

/**
 * Rundown scope for subtrees which mutate entries.
 * Actions are bound to the same rundown as the data, so the two cannot disagree.
 */
export function EditableRundownScopeProvider({ children, rundownId }: RundownScopeProviderProps) {
  return (
    <RundownScopeProvider rundownId={rundownId}>
      <ScopedEntryActions>{children}</ScopedEntryActions>
    </RundownScopeProvider>
  );
}

function ScopedEntryActions({ children }: PropsWithChildren) {
  const { rundownId } = useRundownScope();
  const actions = useScopedEntryActions(rundownId);

  return <EntryActionsProvider actions={actions}>{children}</EntryActionsProvider>;
}
