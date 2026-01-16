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
const PAGE_SIZE = 5;

interface UseRundownCommandsOptions {
  entries: Rundown['entries'];
  order: Rundown['order'];
  entryActions: ReturnType<typeof useEntryActions>;
  setSelectedEvents: (selection: { id: EntryId; selectMode: SelectionMode; index: number }) => void;
  handleCollapseGroup: (collapsed: boolean, groupId: EntryId) => void;
}

/**
 * Common operations for the rundown lists
 */
export function useRundownCommands({
  entries,
  order,
  entryActions,
  setSelectedEvents,
  handleCollapseGroup,
}: UseRundownCommandsOptions) {
  const { addEntry, clone, deleteEntry, move, reorderEntry } = entryActions;

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
      const { entryCopyId, entryCopyMode, setEntryCopyId } = useEntryCopy.getState();
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

      if (entryCopyMode === 'cut') {
        if (!normalisedAtId) {
          const firstId = order[0];
          if (!firstId || firstId === entryCopyId) {
            return;
          }
          reorderEntry(entryCopyId, firstId, 'before')
            .then(() => setEntryCopyId(null))
            .catch(() => {});
          return;
        }
        if (normalisedAtId === entryCopyId) {
          return;
        }
        const placement = above ? 'before' : 'after';
        reorderEntry(entryCopyId, normalisedAtId, placement)
          .then(() => setEntryCopyId(null))
          .catch(() => {});
        return;
      }

      clone(entryCopyId, {
        after: above ? undefined : normalisedAtId ?? undefined,
        // if we don't have a cursor add the new event on top
        before: above ? normalisedAtId ?? undefined : undefined,
      });
    },
    [entries, order, clone, reorderEntry],
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
        return null;
      }
      let newCursor = cursor;
      if (cursor === null) {
        // there is no cursor, we select the first or last depending on direction
        const selected = direction === 'up' ? getLastNormal(entries, order) : getFirstNormal(entries, order);

        if (isOntimeGroup(selected)) {
          setSelectedEvents({ id: selected.id, selectMode: 'click', index: direction === 'up' ? order.length : 0 });
          return selected.id;
        }
        newCursor = selected?.id ?? null;
      }

      if (newCursor === null) {
        return null;
      }

      // otherwise we select the next or previous
      const selected =
        direction === 'up'
          ? getPreviousGroupNormal(entries, order, newCursor)
          : getNextGroupNormal(entries, order, newCursor);

      if (selected.entry !== null && selected.index !== null) {
        setSelectedEvents({ id: selected.entry.id, selectMode: 'click', index: selected.index });
        return selected.entry.id;
      }
      return null;
    },
    [order, entries, setSelectedEvents],
  );

  /**
   * TODO: getPreviousNormal and getNextNormal do not work across group boundaries
   */
  const selectEntry = useCallback(
    (cursor: EntryId | null, direction: 'up' | 'down') => {
      if (order.length < 1) {
        return null;
      }

      if (cursor === null) {
        // there is no cursor, we select the first or last depending on direction if it exists
        const selected = direction === 'up' ? getLastNormal(entries, order) : getFirstNormal(entries, order);
        if (selected !== null) {
          setSelectedEvents({ id: selected.id, selectMode: 'click', index: direction === 'up' ? order.length : 0 });
          return selected.id;
        }
        return null;
      }

      // otherwise we select the next or previous
      const selected =
        direction === 'up' ? getPreviousNormal(entries, order, cursor) : getNextNormal(entries, order, cursor);

      if (selected.entry !== null && selected.index !== null) {
        setSelectedEvents({ id: selected.entry.id, selectMode: 'click', index: selected.index });
        return selected.entry.id;
      }
      return null;
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
      if (order.length < 1) {
        return null;
      }

      const selected = direction === 'top' ? getFirstNormal(entries, order) : getLastNormal(entries, order);
      if (!selected) {
        return null;
      }

      const index = order.indexOf(selected.id);
      if (index === -1) {
        return null;
      }

      setSelectedEvents({ id: selected.id, selectMode: 'click', index });
      return selected.id;
    },
    [entries, order, setSelectedEvents],
  );

  const selectPage = useCallback(
    (cursor: EntryId | null, direction: 'up' | 'down') => {
      if (order.length < 1) {
        return null;
      }

      if (cursor === null) {
        const selected = direction === 'down' ? getFirstNormal(entries, order) : getLastNormal(entries, order);
        if (!selected) {
          return null;
        }
        const index = order.indexOf(selected.id);
        if (index !== -1) {
          setSelectedEvents({ id: selected.id, selectMode: 'click', index });
          return selected.id;
        }
        return null;
      }

      let nextCursor = cursor;
      let target: { entry: OntimeEntry | null; index: number | null } | null = null;

      for (let step = 0; step < PAGE_SIZE; step += 1) {
        const next =
          direction === 'down'
            ? getNextNormal(entries, order, nextCursor)
            : getPreviousNormal(entries, order, nextCursor);
        if (next.entry === null || next.index === null) {
          break;
        }
        target = next;
        nextCursor = next.entry.id;
      }

      if (target?.entry && target.index !== null) {
        setSelectedEvents({ id: target.entry.id, selectMode: 'click', index: target.index });
        return target.entry.id;
      }
      return null;
    },
    [entries, order, setSelectedEvents],
  );

  return {
    cloneEntry,
    deleteAtCursor,
    insertCopyAtId,
    insertAtId,
    selectGroup,
    selectEntry,
    moveEntry,
    selectEdge,
    selectPage,
  };
}
