import { EntryId, OntimeEntry } from 'ontime-types';
import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import Button from '../components/buttons/Button';
import Dialog from '../components/dialog/Dialog';
import type { EntryActions } from '../hooks/useEntryAction';
import { runtimeStore } from '../stores/runtime';

type EntryActionsContextValue = EntryActions;
const EntryActionsContext = createContext<EntryActionsContextValue | null>(null);

type PendingAction =
  | { kind: 'delete'; entryIds: EntryId[]; deleteEntry: EntryActions['deleteEntry'] }
  | { kind: 'skip'; entry: Partial<OntimeEntry>; updateEntry: EntryActions['updateEntry'] };

const dialogCopy = {
  delete: {
    title: 'Delete running event?',
    body: 'This includes the running event. Deleting it will stop the timer.',
    confirm: 'Delete and stop',
  },
  skip: {
    title: 'Skip running event?',
    body: 'This is the running event. Skipping it will stop the timer.',
    confirm: 'Skip and stop',
  },
} as const;

interface EntryActionsProviderProps extends PropsWithChildren {
  actions: EntryActionsContextValue;
  /** whether the actions target the loaded rundown, the only one with a running entry */
  isLoaded: boolean;
}

export function EntryActionsProvider({ children, actions, isLoaded }: EntryActionsProviderProps) {
  // keeps the action of the rundown it was asked in, so a confirm cannot reach another rundown
  const [pending, setPending] = useState<PendingAction | null>(null);
  const { deleteEntry, updateEntry } = actions;

  // deleting or skipping the running entry affects playback, so we ask first
  // the running entry is read on call, so playback changes do not re-render consumers
  const deleteOrConfirm = useCallback(
    async (entryIds: EntryId[]) => {
      const { eventNow, groupNow } = runtimeStore.getState();
      if (isLoaded && entryIds.some((id) => id === eventNow?.id || id === groupNow?.id)) {
        // a request made while the dialog is open is ignored
        setPending((current) => current ?? { kind: 'delete', entryIds, deleteEntry });
        return;
      }
      return deleteEntry(entryIds);
    },
    [deleteEntry, isLoaded],
  );

  const updateOrConfirm = useCallback(
    async (entry: Partial<OntimeEntry>) => {
      const { eventNow } = runtimeStore.getState();
      if (isLoaded && 'skip' in entry && entry.skip === true && entry.id === eventNow?.id) {
        setPending((current) => current ?? { kind: 'skip', entry, updateEntry });
        return;
      }
      return updateEntry(entry);
    },
    [updateEntry, isLoaded],
  );

  const value = useMemo(
    () => ({ ...actions, deleteEntry: deleteOrConfirm, updateEntry: updateOrConfirm }),
    [actions, deleteOrConfirm, updateOrConfirm],
  );

  const close = () => setPending(null);
  const confirm = () => {
    if (pending?.kind === 'delete') {
      void pending.deleteEntry(pending.entryIds);
    } else if (pending?.kind === 'skip') {
      void pending.updateEntry(pending.entry);
    }
    close();
  };

  // keep the last copy while the dialog fades out
  const lastKind = useRef<PendingAction['kind']>('delete');
  if (pending) lastKind.current = pending.kind;
  const copy = dialogCopy[lastKind.current];

  return (
    <EntryActionsContext.Provider value={value}>
      {children}
      <Dialog
        isOpen={pending !== null}
        onClose={close}
        title={copy.title}
        showBackdrop
        showCloseButton
        bodyElements={copy.body}
        footerElements={
          <>
            <Button variant='ghosted-white' size='large' onClick={close}>
              Cancel
            </Button>
            <Button variant='destructive' size='large' onClick={confirm}>
              {copy.confirm}
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
