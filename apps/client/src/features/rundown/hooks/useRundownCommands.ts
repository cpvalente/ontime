import { type EntryId, type OntimeEntry, type Rundown, SupportedEntry } from 'ontime-types';
import { getNextGroupNormal, getNextNormal, getPreviousGroupNormal, getPreviousNormal } from 'ontime-utils';
import { useCallback } from 'react';

import type { useEntryActions } from '../../../common/hooks/useEntryAction';
import { useEntryCopy } from '../../../common/stores/entryCopyStore';
import { SelectionMode } from '../useEventSelection';

const PAGE_SIZE = 5;

interface UseRundownCommandsOptions {
  entries: Rundown['entries'];
  flatOrder: EntryId[];
  entryActions: ReturnType<typeof useEntryActions>;
  selectEntry: (selection: { id: EntryId; selectMode: SelectionMode; index: number }) => void;
  handleCollapseGroup: (collapsed: boolean, groupId: EntryId) => void;
}

/**
 * Common operations for the rundown lists
 */
export function useRundownCommands({
  entries,
  flatOrder,
  entryActions,
  selectEntry: applySelection,
  handleCollapseGroup,
}: UseRundownCommandsOptions) {
  const { addEntry, clone, deleteEntry, move, pasteEntries } = entryActions;

  const deleteAtCursor = useCallback(
    (cursor: string | null) => {
      if (!cursor) return;
      const { entry, index } = getPreviousNormal(entries, flatOrder, cursor);
      deleteEntry([cursor]);
      if (entry && index !== null) {
        applySelection({ id: entry.id, selectMode: 'click', index });
      }
    },
    [entries, flatOrder, deleteEntry, applySelection],
  );

  const pasteAtCursor = useCallback(
    (cursor: EntryId | null, above = false) => {
      const { entryIds, sourceRundownId } = useEntryCopy.getState();
      if (entryIds.size === 0 || !sourceRundownId) {
        return;
      }

      pasteEntries({
        entryIds: Array.from(entryIds),
        sourceRundownId,
        afterId: above ? undefined : (cursor ?? undefined),
        beforeId: above ? (cursor ?? undefined) : undefined,
      });
    },
    [pasteEntries],
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
      if (flatOrder.length < 1) {
        return null;
      }
      const selected =
        direction === 'up'
          ? getPreviousGroupNormal(entries, flatOrder, cursor)
          : getNextGroupNormal(entries, flatOrder, cursor);

      if (selected.entry && selected.index !== null) {
        applySelection({ id: selected.entry.id, selectMode: 'click', index: selected.index });
        return selected.entry.id;
      }
      return null;
    },
    [flatOrder, entries, applySelection],
  );

  const selectEntry = useCallback(
    (cursor: EntryId | null, direction: 'up' | 'down') => {
      if (flatOrder.length < 1) {
        return null;
      }

      const selected =
        direction === 'up' ? getPreviousNormal(entries, flatOrder, cursor) : getNextNormal(entries, flatOrder, cursor);

      if (selected.entry && selected.index !== null) {
        applySelection({ id: selected.entry.id, selectMode: 'click', index: selected.index });
        return selected.entry.id;
      }
      return null;
    },
    [flatOrder, entries, applySelection],
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

  const cloneEntry = useCallback(
    (cursor: EntryId | null) => {
      if (!cursor) {
        return;
      }
      clone(cursor, { after: cursor });
    },
    [clone],
  );

  const selectEdge = useCallback(
    (direction: 'top' | 'bottom') => {
      if (flatOrder.length < 1) {
        return null;
      }

      const index = direction === 'top' ? 0 : flatOrder.length - 1;
      const selectedId = flatOrder[index];
      if (!selectedId) return null;

      applySelection({ id: selectedId, selectMode: 'click', index });
      return selectedId;
    },
    [flatOrder, applySelection],
  );

  const selectPage = useCallback(
    (cursor: EntryId | null, direction: 'up' | 'down') => {
      if (flatOrder.length < 1) {
        return null;
      }

      let currentIndex = cursor ? flatOrder.indexOf(cursor) : -1;
      if (currentIndex === -1) {
        currentIndex = direction === 'down' ? -1 : flatOrder.length;
      }

      let targetIndex = currentIndex;
      let lastValidIndex: number | null = null;
      for (let step = 0; step < PAGE_SIZE; step += 1) {
        targetIndex = direction === 'down' ? targetIndex + 1 : targetIndex - 1;
        if (targetIndex < 0 || targetIndex >= flatOrder.length) {
          break;
        }
        lastValidIndex = targetIndex;
      }

      if (lastValidIndex === null) {
        return null;
      }

      const selectedId = flatOrder[lastValidIndex];
      if (!selectedId) return null;

      applySelection({ id: selectedId, selectMode: 'click', index: lastValidIndex });
      return selectedId;
    },
    [flatOrder, applySelection],
  );

  return {
    cloneEntry,
    deleteAtCursor,
    pasteAtCursor,
    insertAtId,
    selectGroup,
    selectEntry,
    moveEntry,
    selectEdge,
    selectPage,
  };
}
