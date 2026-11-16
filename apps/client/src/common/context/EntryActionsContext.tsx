import { EntryId } from 'ontime-types';
import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from 'react';

import Button from '../components/buttons/Button';
import Dialog from '../components/dialog/Dialog';
import type { EntryActions } from '../hooks/useEntryAction';
import { runtimeStore } from '../stores/runtime';

type EntryActionsContextValue = EntryActions;
const EntryActionsContext = createContext<EntryActionsContextValue | null>(null);

type PendingDelete = { entryIds: EntryId[]; deleteEntry: EntryActions['deleteEntry'] };

interface EntryActionsProviderProps extends PropsWithChildren {
  actions: EntryActionsContextValue;
  /** whether the actions target the loaded rundown, the only one with a running entry */
  isLoaded: boolean;
}

export function EntryActionsProvider({ children, actions, isLoaded }: EntryActionsProviderProps) {
  // keeps the delete of the rundown it was asked in, so a confirm cannot reach another rundown
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const { deleteEntry } = actions;

  // deleting the running entry stops playback, so we ask first
  // the running entry is read on call, so playback changes do not re-render consumers
  const deleteOrConfirm = useCallback(
    async (entryIds: EntryId[]) => {
      const { eventNow, groupNow } = runtimeStore.getState();
      if (isLoaded && entryIds.some((id) => id === eventNow?.id || id === groupNow?.id)) {
        // a request made while the dialog is open is ignored
        setPending((current) => current ?? { entryIds, deleteEntry });
        return;
      }
      return deleteEntry(entryIds);
    },
    [deleteEntry, isLoaded],
  );

  const value = useMemo(() => ({ ...actions, deleteEntry: deleteOrConfirm }), [actions, deleteOrConfirm]);

  const close = () => setPending(null);
  const confirm = () => {
    if (pending) void pending.deleteEntry(pending.entryIds);
    close();
  };

  return (
    <EntryActionsContext.Provider value={value}>
      {children}
      <Dialog
        isOpen={pending !== null}
        onClose={close}
        title='Delete running event?'
        showBackdrop
        showCloseButton
        bodyElements='This includes the running event. Deleting it will stop the timer.'
        footerElements={
          <>
            <Button variant='ghosted-white' size='large' onClick={close}>
              Cancel
            </Button>
            <Button variant='destructive' size='large' onClick={confirm}>
              Delete and stop
            </Button>
          </>
        }
      />
    </EntryActionsContext.Provider>
  );
}

export function useEntryActionsContext(): EntryActionsContextValue {
  const context = useContext(EntryActionsContext);

  if (!context) {
    throw new Error('useEntryActionsContext must be used within EntryActionsProvider');
  }

  return context;
}
