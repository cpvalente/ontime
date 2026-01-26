import { Dispatch, SetStateAction, useCallback, useMemo, useRef } from 'react';
import { DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { type EntryId, type Rundown, isOntimeGroup, SupportedEntry } from 'ontime-types';
import { reorderArray } from 'ontime-utils';

import type { useEntryActions } from '../../../common/hooks/useEntryAction';
import { canDrop } from '../rundown.utils';

interface UseRundownDndOptions {
  entries: Rundown['entries'];
  sortableData: EntryId[];
  setSortableData: Dispatch<SetStateAction<EntryId[]>>;
  getIsCollapsed: (groupId: EntryId) => boolean;
  handleCollapseGroup: (collapsed: boolean, groupId: EntryId | undefined) => void;
  entryActions: ReturnType<typeof useEntryActions>;
}

export function useRundownDnd({
  entries,
  sortableData,
  setSortableData,
  getIsCollapsed,
  handleCollapseGroup,
  entryActions,
}: UseRundownDndOptions) {
  const { reorderEntry } = entryActions;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));
  const isDraggingRef = useRef(false);

  /**
   * On drag end, we reorder the events
   */
  const handleOnDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      isDraggingRef.current = false;

      if (!over?.id || active.id === over.id) {
        return;
      }

      if (!active.data.current || !over.data.current) {
        return;
      }

      const fromIndex: number = active.data.current.sortable.index;
      const toIndex: number = over.data.current.sortable.index;
      let placement: 'before' | 'after' | 'insert' = fromIndex < toIndex ? 'after' : 'before';

      let destinationId = over.id as EntryId;
      const isDraggingGroup = active.data.current?.type === SupportedEntry.Group;

      // prevent dropping a group inside another
      if (
        isDraggingGroup &&
        !canDrop(over.data.current.type, over.data.current.parent, placement, getIsCollapsed(destinationId))
      ) {
        return;
      }

      /**
       * We need to specially handle the end-group
       * Dragging before a end-group will add the entry to the end of the group
       * Dragging after a end-group will add the event after the group itself
       * Dragging to the top of a group either place before first entry or if no entries do insert
       */
      if (destinationId.startsWith('end-')) {
        destinationId = destinationId.replace('end-', '');
        // if we are moving before the end, we use the insert operation
        if (placement === 'before') {
          placement = 'insert';
        }
      } else {
        const group = entries[destinationId];
        // if dragging into a group
        if (isOntimeGroup(group) && placement === 'after') {
          if (isDraggingGroup) {
            // ... and the dragged entry is a group, we know that the group is collapsed, because of the safe check canDrop from before
            // so we can safely push the dragged event after the group
            destinationId = group.id;
          } else if (group.entries.length === 0) {
            // ... and the group is entry, we insert
            destinationId = group.id;
            placement = 'insert';
          } else {
            // otherwise we add it to before the first group child
            destinationId = group.entries[0];
            placement = 'before';
          }
        }
      }

      // Optimistic update pattern to keep DND responsive
      // 1. Keep copy of current state in case we need to revert
      const currentEntries = [...sortableData];
      // 2. Immediately update local state for responsive UI
      setSortableData((currentEntries) => {
        return reorderArray(currentEntries, fromIndex, toIndex);
      });
      // 3. Trigger async mutation, revert on error
      reorderEntry(active.id as EntryId, destinationId, placement).catch((_) => {
        setSortableData(currentEntries);
      });
    },
    [entries, sortableData, setSortableData, getIsCollapsed, reorderEntry],
  );

  /**
   * When we drag a group, we force collapse it
   * This avoids strange scenarios like dropping a group inside itself
   */
  const collapseDraggedGroups = useCallback(
    (event: DragStartEvent) => {
      isDraggingRef.current = true;
      const isGroup = event.active.data.current?.type === SupportedEntry.Group;
      if (isGroup) {
        handleCollapseGroup(true, event.active.id as EntryId);
      }
    },
    [handleCollapseGroup],
  );

  /**
   * When we drag over a group, we expand it if it is collapsed
   */
  const expandOverGroup = useCallback(
    (event: DragOverEvent) => {
      // if we are dragging a group, the drop operation is invalid so we dont expand
      if (event.active.data.current?.type === SupportedEntry.Group) {
        return;
      }
      if (event.over?.data.current?.type !== SupportedEntry.Group) {
        return;
      }

      const groupId = event.over?.id as EntryId | undefined;
      handleCollapseGroup(false, groupId);
    },
    [handleCollapseGroup],
  );

  return useMemo(
    () => ({
      sensors,
      isDraggingRef,
      handleOnDragEnd,
      collapseDraggedGroups,
      expandOverGroup,
    }),
    [sensors, handleOnDragEnd, collapseDraggedGroups, expandOverGroup],
  );
}
