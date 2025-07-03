import { Fragment, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useHotkeys, useSessionStorage } from '@mantine/hooks';
import {
  type EntryId,
  type MaybeString,
  type Rundown,
  isOntimeBlock,
  isOntimeEvent,
  OntimeBlock,
  OntimeEntry,
  Playback,
  SupportedEntry,
} from 'ontime-types';
import {
  getFirstNormal,
  getLastNormal,
  getNextBlockNormal,
  getNextNormal,
  getPreviousBlockNormal,
  getPreviousNormal,
  reorderArray,
} from 'ontime-utils';

import { type EventOptions, useEntryActions } from '../../common/hooks/useEntryAction';
import useFollowComponent from '../../common/hooks/useFollowComponent';
import { useRundownEditor } from '../../common/hooks/useSocket';
import { AppMode, useAppMode } from '../../common/stores/appModeStore';
import { useEntryCopy } from '../../common/stores/entryCopyStore';
import { cloneEvent } from '../../common/utils/clone';

import QuickAddBlock from './quick-add-block/QuickAddBlock';
import BlockEnd from './rundown-block/BlockEnd';
import RundownBlock from './rundown-block/RundownBlock';
import { makeRundownMetadata, makeSortableList, processEntry } from './rundown.utils'; // Added processEntry
import RundownEmpty from './RundownEmpty';
import { useEventSelection } from './useEventSelection';

import style from './Rundown.module.scss';

const RundownEntry = lazy(() => import('./RundownEntry'));

interface RundownProps {
  data: Rundown;
}

export default function Rundown({ data }: RundownProps) {
  const { order, entries, id } = data;
  // we create a copy of the rundown with a data structured aligned with what dnd-kit needs
  const featureData = useRundownEditor();
  const [sortableData, setSortableData] = useState<EntryId[]>(() => makeSortableList(order, entries));
  const [collapsedGroups, setCollapsedGroups] = useSessionStorage<EntryId[]>({
    // we ensure that this is unique to the rundown
    key: `rundown.${id}-editor-collapsed-groups`,
    defaultValue: [],
  });

  const { addEntry, deleteEntry, move, reorderEntry } = useEntryActions();

  const { entryCopyId, setEntryCopyId } = useEntryCopy();

  // cursor
  const { mode: appMode } = useAppMode();
  const { clearSelectedEvents, setSelectedEvents, cursor } = useEventSelection();

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useFollowComponent({ followRef: cursorRef, scrollRef, doFollow: appMode === AppMode.Run });

  // DND KIT
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));

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
    (atId: string | null, copyId: string | null, above = false) => {
      const adjustedCursor = above ? getPreviousNormal(entries, order, atId ?? '').entry?.id ?? null : atId;
      if (copyId === null) {
        // we cant clone without selection
        return;
      }
      const cloneEntry = entries[copyId];
      if (cloneEntry?.type === SupportedEntry.Event) {
        //if we don't have a cursor add the new event on top
        const newEvent = cloneEvent(cloneEntry);
        addEntry(newEvent, { after: adjustedCursor ?? undefined });
      }
    },
    [addEntry, order, entries],
  );

  const insertAtId = useCallback(
    (patch: Partial<OntimeEntry> & { type: SupportedEntry }, id: MaybeString, above = false) => {
      const options: EventOptions =
        id === null
          ? {}
          : {
              after: above ? undefined : id,
              before: above ? id : undefined,
            };

      if (!above && id) {
        options.lastEventId = id;
      }
      addEntry(patch, options);
    },
    [addEntry],
  );

  const selectBlock = useCallback(
    (cursor: string | null, direction: 'up' | 'down') => {
      if (order.length < 1) {
        return;
      }
      let newCursor = cursor;
      if (cursor === null) {
        // there is no cursor, we select the first or last depending on direction
        const selected = direction === 'up' ? getLastNormal(entries, order) : getFirstNormal(entries, order);

        if (isOntimeBlock(selected)) {
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
          ? getPreviousBlockNormal(entries, order, newCursor)
          : getNextBlockNormal(entries, order, newCursor);

      if (selected.entry !== null && selected.index !== null) {
        setSelectedEvents({ id: selected.entry.id, selectMode: 'click', index: selected.index });
      }
    },
    [order, entries, setSelectedEvents],
  );

  const selectEntry = useCallback(
    (cursor: string | null, direction: 'up' | 'down') => {
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

  /**
   * Checks whether a block is collapsed
   */
  const getIsCollapsed = useCallback(
    (blockId: EntryId): boolean => {
      return Boolean(collapsedGroups.find((id) => id === blockId));
    },
    [collapsedGroups],
  );

  /**
   * Handles logic for collapsing groups
   */
  const handleCollapseGroup = useCallback(
    (collapsed: boolean, groupId: EntryId) => {
      setCollapsedGroups((prev) => {
        const isCollapsed = getIsCollapsed(groupId);
        if (collapsed && !isCollapsed) {
          const newSet = new Set(prev).add(groupId);
          return [...newSet];
        }
        if (!collapsed && isCollapsed) {
          return [...prev].filter((id) => id !== groupId);
        }
        return prev;
      });
    },
    [getIsCollapsed, setCollapsedGroups],
  );

  const moveEntry = useCallback(
    async (cursor: EntryId | null, direction: 'up' | 'down') => {
      if (cursor == null) {
        return;
      }

      const movedIntoBlockId = await move(cursor, direction);
      // if we are moving into a block, we need to make sure it is expanded
      if (movedIntoBlockId) {
        handleCollapseGroup(false, movedIntoBlockId);
      }
    },
    [handleCollapseGroup, move],
  );

  // shortcuts
  useHotkeys([
    ['alt + ArrowDown', () => selectEntry(cursor, 'down'), { preventDefault: true }],
    ['alt + ArrowUp', () => selectEntry(cursor, 'up'), { preventDefault: true }],

    ['alt + shift + ArrowDown', () => selectBlock(cursor, 'down'), { preventDefault: true }],
    ['alt + shift + ArrowUp', () => selectBlock(cursor, 'up'), { preventDefault: true }],

    ['alt + mod + ArrowDown', () => moveEntry(cursor, 'down'), { preventDefault: true }],
    ['alt + mod + ArrowUp', () => moveEntry(cursor, 'up'), { preventDefault: true }],

    ['Escape', () => clearSelectedEvents(), { preventDefault: true }],

    ['mod + Backspace', () => deleteAtCursor(cursor), { preventDefault: true }],

    [
      'alt + E',
      () => insertAtId({ type: SupportedEntry.Event }, cursor),
      { preventDefault: true, usePhysicalKeys: true },
    ],
    ['alt + shift + E', () => insertAtId({ type: SupportedEntry.Event }, cursor, true), { preventDefault: true }],

    [
      'alt + B',
      () => insertAtId({ type: SupportedEntry.Block }, cursor),
      { preventDefault: true, usePhysicalKeys: true },
    ],
    ['alt + shift + B', () => insertAtId({ type: SupportedEntry.Block }, cursor, true), { preventDefault: true }],

    [
      'alt + D',
      () => insertAtId({ type: SupportedEntry.Delay }, cursor),
      { preventDefault: true, usePhysicalKeys: true },
    ],
    ['alt + shift + D', () => insertAtId({ type: SupportedEntry.Delay }, cursor, true), { preventDefault: true }],

    ['mod + C', () => setEntryCopyId(cursor)],
    ['mod + V', () => insertCopyAtId(cursor, entryCopyId)],
    ['mod + shift + V', () => insertCopyAtId(cursor, entryCopyId, true), { preventDefault: true }],

    ['alt + backspace', () => deleteAtCursor(cursor), { preventDefault: true }],
  ]);

  // we copy the state from the store here
  // to workaround async updates on the drag mutations
  useEffect(() => {
    setSortableData(makeSortableList(order, entries));
  }, [order, entries]);

  // in run mode, we follow selection
  useEffect(() => {
    if (appMode !== AppMode.Run || !featureData?.selectedEventId) {
      return;
    }
    const index = order.findIndex((id) => id === featureData.selectedEventId);
    setSelectedEvents({ id: featureData.selectedEventId, selectMode: 'click', index });
  }, [appMode, featureData.selectedEventId, order, setSelectedEvents]);

  /**
   * On drag end, we reorder the events
   */
  const handleOnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over?.id || active.id === over.id) {
      return;
    }

    const fromIndex = active.data.current?.sortable.index;
    const toIndex = over.data.current?.sortable.index;

    // we keep a copy of the state as a hack to handle inconsistencies between dnd-kit and async store updates
    setSortableData((currentEntries) => {
      return reorderArray(currentEntries, fromIndex, toIndex);
    });

    let destinationId = over.id as EntryId;
    let order: 'before' | 'after' | 'insert' = fromIndex < toIndex ? 'after' : 'before';

    /**
     * We need to specially handle the end blocks
     * Dragging before and end block will add the entry to the end of the block
     * Dragging after an end block will add the event after the block itself
     */
    if (destinationId.startsWith('end-')) {
      destinationId = destinationId.replace('end-', '');
      // if we are moving before the end, we use the insert operation
      order = 'insert';
    }

    reorderEntry(active.id as EntryId, destinationId, order);
  };

  /**
   * When we drag a block, we force collapse it
   * This avoids strange scenarios like dropping a block inside itself
   */
  const collapseDraggedBlocks = (event: DragStartEvent) => {
    const isBlock = event.active.data.current?.type === 'block';
    if (isBlock) {
      handleCollapseGroup(true, event.active.id as EntryId);
    }
  };

  /**
   * When we drag over a block, we expand it if it is collapsed
   */
  const expandOverBlock = (event: DragOverEvent) => {
    // if we are dragging a block, the drop operation is invalid so we dont expand
    if (event.active.data.current?.type === 'block') {
      return;
    }
    if (event.over?.data.current?.type !== 'block') {
      return;
    }
    const blockId = event.over?.id as EntryId;
    const isCollapsed = getIsCollapsed(blockId);
    if (isCollapsed) {
      handleCollapseGroup(false, blockId);
    }
  };

  if (sortableData.length < 1) {
    return <RundownEmpty handleAddNew={(type: SupportedEntry) => addEntry({ type })} />;
  }

  // 1. gather presentation options
  const isEditMode = appMode === AppMode.Edit;

  // 2. Pre-calculate metadata for all actual entries
  const allEntriesMetadataMap = useMemo(() => {
    const metadataMap = new Map<EntryId, ReturnType<typeof processEntry>>();
    // Get the initial state of metadata for a fresh processing pass
    let currentMeta = makeRundownMetadata(featureData?.selectedEventId).metadata;

    for (const entryId of order) {
      const entry = entries[entryId];
      if (entry) {
        currentMeta = processEntry(currentMeta, featureData?.selectedEventId, entry);
        metadataMap.set(entryId, currentMeta);
      }
    }
    return metadataMap;
  }, [order, entries, featureData?.selectedEventId]);

  // The old `process` function from the per-render makeRundownMetadata call is no longer needed here.
  // The `initialMetadata` might still be useful for pseudo-elements if they need a base state,
  // or we might need to derive context for them differently.
  // For now, let's get the very first initial state for any top-level pseudo elements.
  const initialMetadataForContext = useMemo(
    () => makeRundownMetadata(featureData?.selectedEventId).metadata,
    [featureData?.selectedEventId]
  );

  // To keep track of the *actual* previous entry's metadata for QuickAddBlock context
  let previousActualEntryMetadata: ReturnType<typeof processEntry> | null = null;


  return (
    <div className={style.rundownContainer} ref={scrollRef} data-testid='rundown'>
      <DndContext
        onDragEnd={handleOnDragEnd}
        onDragStart={collapseDraggedBlocks}
        onDragOver={expandOverBlock}
        sensors={sensors}
        collisionDetection={closestCenter}
      >
        <SortableContext items={sortableData} strategy={verticalListSortingStrategy}>
          <div className={style.list}>
            {sortableData.map((entryId, index) => {
              const isFirst = index === 0;
              const isLast = index === sortableData.length - 1;

              if (entryId.startsWith('end-')) {
                const parentId = entryId.split('end-')[1];
                const isBlockCollapsed = getIsCollapsed(parentId);

                if (isBlockCollapsed && isEditMode && isLast) {
                  return <QuickAddBlock key={entryId} previousEventId={parentId} parentBlock={null} />;
                } else if (isBlockCollapsed) {
                  return null;
                } else {
                  const parentBlockEntry = entries[parentId] as OntimeBlock | undefined;
                  const parentColour = parentBlockEntry?.colour;
                  // For the QuickAddBlock *before* a BlockEnd, its context comes from the last actual entry *inside* the block,
                  // or the block itself if the block is empty.
                  // The `previousActualEntryMetadata` should hold metadata of the last processed actual entry.
                  const thisContextPreviousId = previousActualEntryMetadata?.thisId ?? parentId;

                  const showPrependingQuickAdd = isEditMode && cursor !== thisContextPreviousId;
                  return (
                    <Fragment key={entryId}>
                      {showPrependingQuickAdd && (
                        <QuickAddBlock
                          previousEventId={thisContextPreviousId}
                          parentBlock={parentId}
                          backgroundColor={parentColour}
                        />
                      )}
                      <BlockEnd key={entryId} id={entryId} colour={parentColour} />
                      {isEditMode && isLast && <QuickAddBlock previousEventId={parentId} parentBlock={null} />}
                    </Fragment>
                  );
                }
              }

              const entry = entries[entryId];
              if (!entry) return null;

              const currentEntryMetadata = allEntriesMetadataMap.get(entryId);
              if (!currentEntryMetadata) {
                // This should not happen if allEntriesMetadataMap is correctly populated for all entries in `order`
                console.error('Metadata not found for entry:', entryId);
                return null;
              }
              previousActualEntryMetadata = currentEntryMetadata; // Update for the next iteration

              if (
                entry.type !== SupportedEntry.Block &&
                currentEntryMetadata.groupId !== null &&
                getIsCollapsed(currentEntryMetadata.groupId)
              ) {
                return null;
              }

              const isNext = featureData?.nextEventId === entry.id;
              const hasCursor = entry.id === cursor;
              const blockColour = currentEntryMetadata.groupColour === '' ? '#303030' : currentEntryMetadata.groupColour;

              return (
                <Fragment key={entry.id}>
                  {isEditMode && (hasCursor || (isFirst && entry.type !== SupportedEntry.Block)) && (
                     <QuickAddBlock
                      previousEventId={isFirst ? null : currentEntryMetadata.previousEntryId}
                      parentBlock={isFirst ? null : currentEntryMetadata.groupId}
                      backgroundColor={isFirst ? undefined : blockColour}
                    />
                  )}
                   {isOntimeBlock(entry) ? (
                    <RundownBlock
                      data={entry}
                      hasCursor={hasCursor}
                      collapsed={getIsCollapsed(entry.id)}
                      onCollapse={handleCollapseGroup}
                    />
                  ) : (
                    <div
                      className={style.entryWrapper}
                      data-testid={`entry-${currentEntryMetadata.eventIndex}`}
                      style={blockColour ? { '--user-bg': blockColour } : {}}
                    >
                      {isOntimeEvent(entry) && <div className={style.entryIndex}>{currentEntryMetadata.eventIndex}</div>}
                      <div className={style.entry} key={entry.id} ref={hasCursor ? cursorRef : undefined}>
                        <RundownEntry
                          type={entry.type}
                          isPast={currentEntryMetadata.isPast}
                          eventIndex={currentEntryMetadata.eventIndex}
                          data={entry}
                          loaded={currentEntryMetadata.isLoaded}
                          hasCursor={hasCursor}
                          isNext={isNext}
                          previousEntryId={currentEntryMetadata.previousEntryId}
                          previousEventId={currentEntryMetadata.previousEvent?.id}
                          playback={currentEntryMetadata.isLoaded ? featureData.playback : undefined}
                          isRolling={featureData.playback === Playback.Roll}
                          isNextDay={currentEntryMetadata.isNextDay}
                          totalGap={currentEntryMetadata.totalGap}
                          isLinkedToLoaded={currentEntryMetadata.isLinkedToLoaded}
                        />
                      </div>
                    </div>
                  )}
                  {isEditMode && hasCursor && ( // Only show QuickAddBlock after if this specific item has cursor
                    <QuickAddBlock
                      previousEventId={entry.id} // Previous is this entry itself
                      parentBlock={currentEntryMetadata.groupId}
                      backgroundColor={blockColour}
                    />
                  )}
                  {/* Special case for last item if it's not the one with cursor but needs a QAB */}
                  {isEditMode && isLast && !hasCursor && (
                     <QuickAddBlock
                      previousEventId={entry.id}
                      parentBlock={currentEntryMetadata.groupId}
                      backgroundColor={blockColour}
                    />
                  )}
                </Fragment>
              );
            })}
            <div className={style.spacer} />
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
