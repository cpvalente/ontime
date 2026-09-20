import {
  type Active,
  type Data,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  type Over,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { type EntryId, type Rundown, SupportedEntry, isOntimeGroup } from 'ontime-types';
import { reorderArray } from 'ontime-utils';
import { Dispatch, SetStateAction, useCallback, useMemo, useRef, useState } from 'react';

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
   * The rundown list is virtualised, which means that the dragged element can be unmounted
   * if the user drags it far enough for it to leave the render window.
   * When that happens, dnd-kit loses the data associated with the active element,
   * so we keep our own copy from the moment the drag started.
   */
  const activeDataRef = useRef<Data | null>(null);
  const [activeId, setActiveId] = useState<EntryId | null>(null);
  const [isValidDrop, setIsValidDrop] = useState(true);

  /**
   * Groups we force collapsed for the duration of the drag, so we can restore the users view after
   */
  const forceCollapsedGroupRef = useRef<EntryId | null>(null);

  /**
   * Resolves the data of the dragged element
   * If the element was unmounted by the virtualiser, dnd-kit gives us empty data
   * in which case we fallback to the snapshot taken on drag start
   */
  const getActiveData = useCallback((active: Active): Data | null => {
    return active.data.current?.sortable ? active.data.current : activeDataRef.current;
  }, []);

  /**
   * Whether the dragged element can be dropped at the position it is currently over
   * Only groups are restricted, since they cannot be nested inside another group
   */
  const canDropOver = useCallback(
    (activeData: Data | null, over: Over | null): boolean => {
      if (!activeData?.sortable || !over?.data.current) {
        return true;
      }

      if (activeData.type !== SupportedEntry.Group) {
        return true;
      }

      const placement = activeData.sortable.index < over.data.current.sortable.index ? 'after' : 'before';
      return canDrop(over.data.current.type, over.data.current.parent, placement, getIsCollapsed(over.id as EntryId));
    },
    [getIsCollapsed],
  );

  /**
   * Discards any reference to the dragged element, also used as the drag cancel handler
   */
  const clearActive = useCallback(() => {
    isDraggingRef.current = false;
    activeDataRef.current = null;
    setActiveId(null);
    setIsValidDrop(true);

    // the group was expanded before the drag, we give the user their view back
    const forceCollapsedGroup = forceCollapsedGroupRef.current;
    forceCollapsedGroupRef.current = null;
    if (forceCollapsedGroup) {
      handleCollapseGroup(false, forceCollapsedGroup);
    }
  }, [handleCollapseGroup]);

  /**
   * On drag end, we reorder the events
   */
  const handleOnDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const activeData = getActiveData(active);
      clearActive();

      if (!over?.id || active.id === over.id) {
        return;
      }

      if (!activeData?.sortable || !over.data.current) {
        return;
      }

      const fromIndex: number = activeData.sortable.index;
      const toIndex: number = over.data.current.sortable.index;
      let placement: 'before' | 'after' | 'insert' = fromIndex < toIndex ? 'after' : 'before';

      let destinationId = over.id as EntryId;
      const isDraggingGroup = activeData.type === SupportedEntry.Group;

      // prevent dropping a group inside another
      if (!canDropOver(activeData, over)) {
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
    [entries, sortableData, setSortableData, reorderEntry, getActiveData, canDropOver, clearActive],
  );

  /**
   * On drag start we keep a reference to the dragged element
   * and, if we are dragging a group, we force collapse it
   * This avoids strange scenarios like dropping a group inside itself
   */
  const handleOnDragStart = useCallback(
    (event: DragStartEvent) => {
      isDraggingRef.current = true;
      activeDataRef.current = event.active.data.current ?? null;
      setActiveId(event.active.id as EntryId);
      setIsValidDrop(true);

      const isGroup = event.active.data.current?.type === SupportedEntry.Group;
      if (isGroup) {
        const groupId = event.active.id as EntryId;
        forceCollapsedGroupRef.current = getIsCollapsed(groupId) ? null : groupId;
        handleCollapseGroup(true, groupId);
      }
    },
    [handleCollapseGroup, getIsCollapsed],
  );

  /**
   * When the element we are over changes, we keep track of whether it is a valid drop
   * and, if we drag an entry over a collapsed group, we expand it so it can be dropped inside
   */
  const handleOnDragOver = useCallback(
    (event: DragOverEvent) => {
      const activeData = getActiveData(event.active);
      setIsValidDrop(canDropOver(activeData, event.over));

      // if we are dragging a group, the drop operation is invalid so we dont expand
      // expanding the group here would also make an otherwise valid drop after it invalid
      if (activeData?.type === SupportedEntry.Group) {
        return;
      }
      if (event.over?.data.current?.type !== SupportedEntry.Group) {
        return;
      }

      handleCollapseGroup(false, event.over.id as EntryId);
    },
    [handleCollapseGroup, getActiveData, canDropOver],
  );

  return useMemo(
    () => ({
      sensors,
      isDraggingRef,
      activeId,
      isValidDrop,
      handleOnDragEnd,
      handleOnDragStart,
      handleOnDragCancel: clearActive,
      handleOnDragOver,
    }),
    [sensors, activeId, isValidDrop, handleOnDragEnd, handleOnDragStart, clearActive, handleOnDragOver],
  );
}
