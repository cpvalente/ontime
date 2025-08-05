import { Fragment, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { TbFlagFilled } from 'react-icons/tb';
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

import { useEntryActions } from '../../common/hooks/useEntryAction';
import useFollowComponent from '../../common/hooks/useFollowComponent';
import { useRundownEditor } from '../../common/hooks/useSocket';
import { useEntryCopy } from '../../common/stores/entryCopyStore';
import { cloneEvent } from '../../common/utils/clone';
import { AppMode, sessionKeys } from '../../ontimeConfig';

import QuickAddButtons from './entry-editor/quick-add-buttons/QuickAddButtons';
import QuickAddInline from './entry-editor/quick-add-cursor/QuickAddInline';
import RundownBlock from './rundown-block/RundownBlock';
import RundownBlockEnd from './rundown-block/RundownBlockEnd';
import { canDrop, makeRundownMetadata, makeSortableList } from './rundown.utils';
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
  const [editorMode] = useSessionStorage<AppMode>({
    key: sessionKeys.editorMode,
    defaultValue: AppMode.Edit,
  });
  const { clearSelectedEvents, setSelectedEvents, cursor } = useEventSelection();

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useFollowComponent({ followRef: cursorRef, scrollRef, doFollow: editorMode === AppMode.Run });

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

  /**
   * Add a new item referring to an existing one
   */
  const insertAtId = useCallback(
    (patch: Partial<OntimeEntry> & { type: SupportedEntry }, id: MaybeString, above = false) => {
      addEntry(patch, {
        after: id && !above ? id : undefined,
        before: id && above ? id : undefined,
        lastEventId: !above && id ? id : undefined,
      });
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
    ['alt + ArrowDown', () => selectEntry(cursor, 'down'), { preventDefault: true, usePhysicalKeys: true }],
    ['alt + ArrowUp', () => selectEntry(cursor, 'up'), { preventDefault: true, usePhysicalKeys: true }],

    ['alt + shift + ArrowDown', () => selectBlock(cursor, 'down'), { preventDefault: true, usePhysicalKeys: true }],
    ['alt + shift + ArrowUp', () => selectBlock(cursor, 'up'), { preventDefault: true, usePhysicalKeys: true }],

    ['alt + mod + ArrowDown', () => moveEntry(cursor, 'down'), { preventDefault: true, usePhysicalKeys: true }],
    ['alt + mod + ArrowUp', () => moveEntry(cursor, 'up'), { preventDefault: true, usePhysicalKeys: true }],

    ['Escape', () => clearSelectedEvents(), { preventDefault: true, usePhysicalKeys: true }],

    ['mod + Backspace', () => deleteAtCursor(cursor), { preventDefault: true, usePhysicalKeys: true }],

    [
      'alt + E',
      () => insertAtId({ type: SupportedEntry.Event }, cursor),
      { preventDefault: true, usePhysicalKeys: true },
    ],
    [
      'alt + shift + E',
      () => insertAtId({ type: SupportedEntry.Event }, cursor, true),
      { preventDefault: true, usePhysicalKeys: true },
    ],

    [
      'alt + G',
      () => insertAtId({ type: SupportedEntry.Block }, cursor),
      { preventDefault: true, usePhysicalKeys: true },
    ],
    [
      'alt + shift + G',
      () => insertAtId({ type: SupportedEntry.Block }, cursor, true),
      { preventDefault: true, usePhysicalKeys: true },
    ],

    [
      'alt + D',
      () => insertAtId({ type: SupportedEntry.Delay }, cursor),
      { preventDefault: true, usePhysicalKeys: true },
    ],
    [
      'alt + shift + D',
      () => insertAtId({ type: SupportedEntry.Delay }, cursor, true),
      { preventDefault: true, usePhysicalKeys: true },
    ],

    [
      'alt + M',
      () => insertAtId({ type: SupportedEntry.Milestone }, cursor),
      { preventDefault: true, usePhysicalKeys: true },
    ],
    [
      'alt + shift + M',
      () => insertAtId({ type: SupportedEntry.Milestone }, cursor, true),
      { preventDefault: true, usePhysicalKeys: true },
    ],

    ['mod + C', () => setEntryCopyId(cursor)],
    ['mod + V', () => insertCopyAtId(cursor, entryCopyId)],
    [
      'mod + shift + V',
      () => insertCopyAtId(cursor, entryCopyId, true),
      { preventDefault: true, usePhysicalKeys: true },
    ],

    ['alt + backspace', () => deleteAtCursor(cursor), { preventDefault: true, usePhysicalKeys: true }],
  ]);

  // we copy the state from the store here
  // to workaround async updates on the drag mutations
  useEffect(() => {
    setSortableData(makeSortableList(order, entries));
  }, [order, entries]);

  // in run mode, we follow selection
  useEffect(() => {
    if (editorMode !== AppMode.Run || !featureData?.selectedEventId) {
      return;
    }
    const index = order.findIndex((id) => id === featureData.selectedEventId);
    // @ts-expect-error -- but we safely check if the parent property exists
    const maybeParent = entries[featureData.selectedEventId]?.parent;
    if (maybeParent) {
      // open the group
      setCollapsedGroups((prev) => [...prev].filter((id) => id !== maybeParent));
    }

    setSelectedEvents({ id: featureData.selectedEventId, selectMode: 'click', index });
  }, [editorMode, entries, featureData.selectedEventId, order, setCollapsedGroups, setSelectedEvents]);

  /**
   * On drag end, we reorder the events
   */
  const handleOnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over?.id || active.id === over.id) {
      return;
    }

    // prevent dropping a group inside another
    if (active.data.current?.type === 'block' && !canDrop(over.data.current?.type, over.data.current?.parent)) {
      return;
    }

    const fromIndex = active.data.current?.sortable.index;
    const toIndex = over.data.current?.sortable.index;

    let destinationId = over.id as EntryId;
    let order: 'before' | 'after' | 'insert' = fromIndex < toIndex ? 'after' : 'before';

    /**
     * We need to specially handle the end blocks
     * Dragging before and end block will add the entry to the end of the block
     * Dragging after an end block will add the event after the block itself
     * Dragging to the top of a block either place before first entry or if no entries do insert
     */
    if (destinationId.startsWith('end-')) {
      destinationId = destinationId.replace('end-', '');
      // if we are moving before the end, we use the insert operation
      if (order === 'before') {
        order = 'insert';
      }
    } else {
      const block = data.entries[destinationId];
      if (isOntimeBlock(block) && order === 'after') {
        if (block.entries.length === 0) order = 'insert';
        else {
          destinationId = block.entries[0];
          order = 'before';
        }
      }
    }

    // keep copy of the current state in case we need to revert
    const currentEntries = structuredClone(sortableData);
    // we keep a copy of the state as a hack to handle inconsistencies between dnd-kit and async store updates
    setSortableData((currentEntries) => {
      return reorderArray(currentEntries, fromIndex, toIndex);
    });
    reorderEntry(active.id as EntryId, destinationId, order).catch((_) => {
      setSortableData(currentEntries);
    });
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
  const isEditMode = editorMode === AppMode.Edit;

  // 2. initialise rundown metadata
  const { metadata, process } = makeRundownMetadata(featureData?.selectedEventId);
  // keep a single reference to the metadata which we override for every entry
  let rundownMetadata = metadata;

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
            {isEditMode && <QuickAddButtons previousEventId={null} parentBlock={null} />}
            {sortableData.map((entryId, index) => {
              // the entry might be a pseudo block-end which does not generate metadata and should not be processed
              if (entryId.startsWith('end-')) {
                const parentId = entryId.split('end-')[1];
                const isBlockCollapsed = getIsCollapsed(parentId);

                if (isBlockCollapsed) {
                  return null;
                }

                // if the previous element is selected, it will have its own QuickAddInline
                // we use thisId instead of previousEntryId because the block end does not process
                // and it does not cause the reassignment of the iteration id to the previous entry
                return (
                  <Fragment key={entryId}>
                    {isEditMode && rundownMetadata.groupEntries === 0 && (
                      <QuickAddButtons
                        previousEventId={null}
                        parentBlock={parentId}
                        backgroundColor={rundownMetadata.groupColour}
                      />
                    )}
                    <RundownBlockEnd key={entryId} id={entryId} colour={rundownMetadata.groupColour} />
                  </Fragment>
                );
              }

              // we iterate through a stateful copy of order to make the dnd operations smoother
              // this means that this can be out of sync with order until the useEffect runs
              // instead of writing all the logic guards, we simply short circuit rendering here
              const entry = entries[entryId];
              if (!entry) return null;

              rundownMetadata = process(entry);

              // if the entry has a parent, and it is collapsed, render nothing
              if (
                entry.type !== SupportedEntry.Block &&
                rundownMetadata.groupId !== null &&
                getIsCollapsed(rundownMetadata.groupId)
              ) {
                return null;
              }

              const isNext = featureData?.nextEventId === entry.id;
              const hasCursor = entry.id === cursor;

              /**
               * Outside a block, the value will be undefined
               * If the colour is empty string ''
               * ie: we are inside a block, but there is no defined colour
               * we default to $gray-500 #9d9d9d
               */
              const blockColour = rundownMetadata.groupColour === '' ? '#9d9d9d' : rundownMetadata.groupColour;

              const isFirst = index === 0;
              const isLast = entryId === order.at(-1);

              /**
               * We need to provide the parent ID for the QuickAdd components
               * This should be different depending on whether we are adding before or after an element
               * - when adding before, we need to avoid a group referencing itself as the parent
               * - when adding after, we can use the group ID directly to insert at the top of the group
               */

              const parentIdForBefore =
                rundownMetadata.thisId !== rundownMetadata.groupId ? rundownMetadata.groupId : null;
              const parentIdForAfter = rundownMetadata.groupId;

              return (
                <Fragment key={entry.id}>
                  {/**
                   * Before the entry
                   * - edit mode only
                   * - if there is a cursor
                   * - if it is not the first entry (the buttons would be there)
                   */}
                  {isEditMode && hasCursor && !isFirst && (
                    <QuickAddInline previousEventId={rundownMetadata.previousEntryId} parentBlock={parentIdForBefore} />
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
                      data-testid={`entry-${rundownMetadata.eventIndex}`}
                      style={blockColour ? { '--user-bg': blockColour } : {}}
                    >
                      {isOntimeEvent(entry) && (
                        <div className={style.entryIndex}>
                          {entry.flag && <TbFlagFilled className={style.flag} />}
                          <div className={style.index}>{rundownMetadata.eventIndex}</div>
                        </div>
                      )}
                      <div className={style.entry} key={entry.id} ref={hasCursor ? cursorRef : undefined}>
                        <RundownEntry
                          type={entry.type}
                          isPast={rundownMetadata.isPast}
                          eventIndex={rundownMetadata.eventIndex}
                          data={entry}
                          loaded={rundownMetadata.isLoaded}
                          hasCursor={hasCursor}
                          isNext={isNext}
                          previousEntryId={rundownMetadata.previousEntryId}
                          previousEventId={rundownMetadata.previousEvent?.id}
                          playback={rundownMetadata.isLoaded ? featureData.playback : undefined}
                          isRolling={featureData.playback === Playback.Roll}
                          isNextDay={rundownMetadata.isNextDay}
                          totalGap={rundownMetadata.totalGap}
                          isLinkedToLoaded={rundownMetadata.isLinkedToLoaded}
                        />
                      </div>
                    </div>
                  )}
                  {/**
                   * After the entry
                   * - edit mode only
                   * - if there is a cursor
                   * - if it is not the last entry (the buttons would be there)
                   * - if the entry is not the block header
                   */}
                  {isEditMode && hasCursor && !isLast && (
                    <QuickAddInline previousEventId={entry.id} parentBlock={parentIdForAfter} />
                  )}
                </Fragment>
              );
            })}
            {isEditMode && (
              <QuickAddButtons previousEventId={rundownMetadata.groupId ?? rundownMetadata.thisId} parentBlock={null} />
            )}
            <div className={style.spacer} />
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
