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

type Placement = 'before' | 'after';

interface DropTarget {
  id: EntryId;
  placement: Placement;
}

function getPlacement(fromIndex: number, toIndex: number): Placement {
  return fromIndex < toIndex ? 'after' : 'before';
}

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

  // dnd-kit clears active data when its virtualized source unmounts.
  const activeDataRef = useRef<Data | null>(null);
  const [activeId, setActiveId] = useState<EntryId | null>(null);
  const [isValidDrop, setIsValidDrop] = useState(true);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  // Restore the source group's original expanded state after the drag.
  const forceCollapsedGroupRef = useRef<EntryId | null>(null);

  const getActiveData = useCallback((active: Active): Data | null => {
    return active.data.current?.sortable ? active.data.current : activeDataRef.current;
  }, []);

  const canDropOver = useCallback(
    (active: Active, activeData: Data | null, over: Over | null): boolean => {
      if (!activeData?.sortable || !over?.data.current) {
        return true;
      }

      if (activeData.type !== SupportedEntry.Group) {
        return true;
      }

      // a group cannot be dropped inside itself
      if (over.data.current.parent === active.id || over.id === `end-${active.id}`) {
        return false;
      }

      const placement = getPlacement(activeData.sortable.index, over.data.current.sortable.index);
      return canDrop(over.data.current.type, over.data.current.parent, placement, getIsCollapsed(over.id as EntryId));
    },
    [getIsCollapsed],
  );

  const endDrag = useCallback(() => {
    isDraggingRef.current = false;
    activeDataRef.current = null;
    setActiveId(null);
    setIsValidDrop(true);
    setDropTarget(null);

    const forceCollapsedGroup = forceCollapsedGroupRef.current;
    forceCollapsedGroupRef.current = null;
    if (forceCollapsedGroup) {
      handleCollapseGroup(false, forceCollapsedGroup);
    }
  }, [handleCollapseGroup]);

  const handleOnDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const activeData = getActiveData(active);
      endDrag();

      if (!over?.id || active.id === over.id) {
        return;
      }

      if (!activeData?.sortable || !over.data.current) {
        return;
      }

      const fromIndex: number = activeData.sortable.index;
      const toIndex: number = over.data.current.sortable.index;
      let placement: Placement | 'insert' = getPlacement(fromIndex, toIndex);

      let destinationId = over.id as EntryId;
      const isDraggingGroup = activeData.type === SupportedEntry.Group;

      // prevent dropping a group inside another
      if (!canDropOver(active, activeData, over)) {
        return;
      }

      // An end marker distinguishes insertion inside its group from placement after it.
      if (destinationId.startsWith('end-')) {
        destinationId = destinationId.replace('end-', '');
        if (placement === 'before') {
          placement = 'insert';
        }
      } else {
        const group = entries[destinationId];
        if (isOntimeGroup(group) && placement === 'after') {
          if (isDraggingGroup) {
            destinationId = group.id;
          } else if (group.entries.length === 0) {
            destinationId = group.id;
            placement = 'insert';
          } else {
            destinationId = group.entries[0];
            placement = 'before';
          }
        }
      }

      const previousSortableData = [...sortableData];
      setSortableData((currentSortableData) => {
        return reorderArray(currentSortableData, fromIndex, toIndex);
      });
      // Restore the previous list order if the mutation fails.
      reorderEntry(active.id as EntryId, destinationId, placement).catch((_) => {
        setSortableData(previousSortableData);
      });
    },
    [entries, sortableData, setSortableData, reorderEntry, getActiveData, canDropOver, endDrag],
  );

  const handleOnDragStart = useCallback(
    (event: DragStartEvent) => {
      isDraggingRef.current = true;
      activeDataRef.current = event.active.data.current ?? null;
      setActiveId(event.active.id as EntryId);
      setIsValidDrop(true);

      if (event.active.data.current?.type === SupportedEntry.Group) {
        const groupId = event.active.id as EntryId;
        forceCollapsedGroupRef.current = getIsCollapsed(groupId) ? null : groupId;
        handleCollapseGroup(true, groupId);
      }
    },
    [handleCollapseGroup, getIsCollapsed],
  );

  const handleOnDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      const activeData = getActiveData(active);
      const isValid = canDropOver(active, activeData, over);

      setIsValidDrop(isValid);
      const nextDropTarget =
        isValid && activeData?.sortable && over?.data.current && over.id !== active.id
          ? {
              id: over.id as EntryId,
              placement: getPlacement(activeData.sortable.index, over.data.current.sortable.index),
            }
          : null;
      setDropTarget((currentDropTarget) =>
        currentDropTarget?.id === nextDropTarget?.id && currentDropTarget?.placement === nextDropTarget?.placement
          ? currentDropTarget
          : nextDropTarget,
      );

      // Expanding a group makes an otherwise valid drop after it invalid.
      if (activeData?.type === SupportedEntry.Group) {
        return;
      }
      if (over?.data.current?.type !== SupportedEntry.Group) {
        return;
      }

      handleCollapseGroup(false, over.id as EntryId);
    },
    [handleCollapseGroup, getActiveData, canDropOver],
  );

  return useMemo(
    () => ({
      sensors,
      isDraggingRef,
      activeId,
      isValidDrop,
      dropTarget,
      handleOnDragEnd,
      handleOnDragStart,
      handleOnDragCancel: endDrag,
      handleOnDragOver,
    }),
    [sensors, activeId, isValidDrop, dropTarget, handleOnDragEnd, handleOnDragStart, endDrag, handleOnDragOver],
  );
}
