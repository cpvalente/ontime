import { useCallback } from 'react';
import { type EntryId, type OntimeEntry, type Rundown, isOntimeGroup, SupportedEntry } from 'ontime-types';
import {
  getFirstNormal,
  getLastNormal,
  getNextGroupNormal,
  getNextNormal,
  getPreviousGroupNormal,
  getPreviousNormal,
} from 'ontime-utils';

import type { useEntryActions } from '../../../common/hooks/useEntryAction';
import { useEntryCopy } from '../../../common/stores/entryCopyStore';

type SelectionMode = 'shift' | 'click' | 'ctrl';

interface UseRundownCommandsOptions {
  entries: Rundown['entries'];
  order: Rundown['order'];
  entryActions: ReturnType<typeof useEntryActions>;
  setSelectedEvents: (selection: { id: EntryId; selectMode: SelectionMode; index: number }) => void;
  handleCollapseGroup: (collapsed: boolean, groupId: EntryId) => void;
}

export function useRundownCommands({
  entries,
  order,
  entryActions,
  setSelectedEvents,
  handleCollapseGroup,
}: UseRundownCommandsOptions) {
  const { addEntry, clone, deleteEntry, move } = entryActions;
  const deleteAtCursor = useCallback(
    (cursor: string | null) => {
      if (!cursor) return;
      const { entry, index } = getPreviousNormal(entries, order, cursor);
      deleteEntry([cursor]);
      if (entry && index !== null) {
        setSelectedEvents({ id: entry.id, selectMode: 'click', index });
      }
    },
    [entries, order, deleteEntry, setSelectedEvents],
  );

  const insertCopyAtId = useCallback(
    (atId: EntryId | null, above = false) => {
      // lazily get the value from the store
      const { entryCopyId } = useEntryCopy.getState();
      if (entryCopyId === null || !entries[entryCopyId]) {
        // we cant clone without selection
        return;
      }

      let normalisedAtId = atId;

      const elementToCopy = entries[entryCopyId];
      const refElement = atId ? entries[atId] : undefined;

      if (refElement && 'parent' in refElement && refElement.parent && elementToCopy.type === SupportedEntry.Group) {
        normalisedAtId = refElement.parent;
      }

      clone(entryCopyId, {
        after: above ? undefined : normalisedAtId ?? undefined,
        // if we don't have a cursor add the new event on top
        before: above ? normalisedAtId ?? undefined : undefined,
      });
    },
    [entries, clone],
  );

  /**
   * Add a new item referring to an existing one
   */
  const insertAtId = useCallback(
    (patch: Partial<OntimeEntry> & { type: SupportedEntry }, id: EntryId | null, above = false) => {
      addEntry(patch, {
        after: id && !above ? id : undefined,
        before: id && above ? id : undefined,
        lastEventId: !above && id ? id : undefined,
      });
    },
    [addEntry],
  );

  const selectGroup = useCallback(
    (cursor: EntryId | null, direction: 'up' | 'down') => {
      if (order.length < 1) {
        return;
      }
      let newCursor = cursor;
      if (cursor === null) {
        // there is no cursor, we select the first or last depending on direction
        const selected = direction === 'up' ? getLastNormal(entries, order) : getFirstNormal(entries, order);

        if (isOntimeGroup(selected)) {
          setSelectedEvents({ id: selected.id, selectMode: 'click', index: direction === 'up' ? order.length : 0 });
          return;
        }
        newCursor = selected?.id ?? null;
      }

      if (newCursor === null) {
        return;
      }

      // otherwise we select the next or previous
      const selected =
        direction === 'up'
          ? getPreviousGroupNormal(entries, order, newCursor)
          : getNextGroupNormal(entries, order, newCursor);

      if (selected.entry !== null && selected.index !== null) {
        setSelectedEvents({ id: selected.entry.id, selectMode: 'click', index: selected.index });
      }
    },
    [order, entries, setSelectedEvents],
  );

  /**
   * TODO: getPreviousNormal and getNextNormal do not work across group boundaries
   */
  const selectEntry = useCallback(
    (cursor: EntryId | null, direction: 'up' | 'down') => {
      if (order.length < 1) {
        return;
      }

      if (cursor === null) {
        // there is no cursor, we select the first or last depending on direction if it exists
        const selected = direction === 'up' ? getLastNormal(entries, order) : getFirstNormal(entries, order);
        if (selected !== null) {
          setSelectedEvents({ id: selected.id, selectMode: 'click', index: direction === 'up' ? order.length : 0 });
        }
        return;
      }

      // otherwise we select the next or previous
      const selected =
        direction === 'up' ? getPreviousNormal(entries, order, cursor) : getNextNormal(entries, order, cursor);

      if (selected.entry !== null && selected.index !== null) {
        setSelectedEvents({ id: selected.entry.id, selectMode: 'click', index: selected.index });
      }
    },
    [order, entries, setSelectedEvents],
  );

  const moveEntry = useCallback(
    async (cursor: EntryId | null, direction: 'up' | 'down') => {
      if (cursor == null) {
        return;
      }

      const movedIntoGroupId = await move(cursor, direction);
      // if we are moving into a group, we need to make sure it is expanded
      if (movedIntoGroupId) {
        handleCollapseGroup(false, movedIntoGroupId);
      }
    },
    [handleCollapseGroup, move],
  );

  return {
    deleteAtCursor,
    insertCopyAtId,
    insertAtId,
    selectGroup,
    selectEntry,
    moveEntry,
  };
}
