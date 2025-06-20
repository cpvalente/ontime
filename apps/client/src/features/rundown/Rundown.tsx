import { Fragment, lazy, useCallback, useEffect, useRef, useState } from 'react';
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
import { cloneEvent } from '../../common/utils/eventsManager';

import BlockBlock from './block-block/BlockBlock';
import BlockEnd from './block-block/BlockEnd';
import QuickAddBlock from './quick-add-block/QuickAddBlock';
import { makeRundownMetadata, makeSortableList } from './rundown.utils';
import RundownEmpty from './RundownEmpty';
import { useEventSelection } from './useEventSelection';

import style from './Rundown.module.scss';

const RundownEntry = lazy(() => import('./RundownEntry'));

interface RundownProps {
  data: Rundown;
}

export default function Rundown({ data }: RundownProps) {
  const { order, flatOrder, entries, id } = data;
  // we create a copy of the rundown with a data structured aligned with what dnd-kit needs
  const featureData = useRundownEditor();
  const [sortableData, setSortableData] = useState<EntryId[]>(() => makeSortableList(flatOrder, entries));
  const [collapsedGroups, setCollapsedGroups] = useSessionStorage<EntryId[]>({
    // we ensure that this is unique to the rundown
    key: `rundown.${id}-editor-collapsed-groups`,
    defaultValue: [],
  });

  const { addEntry, reorderEntry, deleteEntry } = useEntryActions();

  const { entryCopyId, setEntryCopyId } = useEntryCopy();

  // cursor
  const { mode: appMode } = useAppMode();
  const { clearSelectedEvents, setSelectedEvents, cursor } = useEventSelection();

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useFollowComponent({ followRef: cursorRef, scrollRef, doFollow: appMode === AppMode.Run });

  // DND KIT
  const sensors = useSensors(useSensor(PointerSensor));

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

  const moveEntry = useCallback(
    (cursor: string | null, direction: 'up' | 'down') => {
      if (order.length < 2 || cursor == null) {
        return;
      }
      const { index } =
        direction === 'up' ? getPreviousNormal(entries, order, cursor) : getNextNormal(entries, order, cursor);

      if (index !== null) {
        const offsetIndex = direction === 'up' ? index + 1 : index - 1;
        reorderEntry(cursor, offsetIndex, index);
      }
    },
    [order, reorderEntry, entries],
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

    ['alt + E', () => insertAtId({ type: SupportedEntry.Event }, cursor), { preventDefault: true }],
    ['alt + shift + E', () => insertAtId({ type: SupportedEntry.Event }, cursor, true), { preventDefault: true }],

    ['alt + B', () => insertAtId({ type: SupportedEntry.Block }, cursor), { preventDefault: true }],
    ['alt + shift + B', () => insertAtId({ type: SupportedEntry.Block }, cursor, true), { preventDefault: true }],

    ['alt + D', () => insertAtId({ type: SupportedEntry.Delay }, cursor), { preventDefault: true }],
    ['alt + shift + D', () => insertAtId({ type: SupportedEntry.Delay }, cursor, true), { preventDefault: true }],

    ['mod + C', () => setEntryCopyId(cursor)],
    ['mod + V', () => insertCopyAtId(cursor, entryCopyId)],
    ['mod + shift + V', () => insertCopyAtId(cursor, entryCopyId, true), { preventDefault: true }],

    ['alt + backspace', () => deleteAtCursor(cursor), { preventDefault: true }],
  ]);

  // we copy the state from the store here
  // to workaround async updates on the drag mutations
  useEffect(() => {
    setSortableData(makeSortableList(flatOrder, entries));
  }, [flatOrder, entries]);

  // in run mode, we follow selection
  useEffect(() => {
    if (appMode !== AppMode.Run || !featureData?.selectedEventId) {
      return;
    }
    const index = order.findIndex((id) => id === featureData.selectedEventId);
    setSelectedEvents({ id: featureData.selectedEventId, selectMode: 'click', index });
  }, [appMode, featureData.selectedEventId, order, setSelectedEvents]);

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

  /**
   * On drag end, we reorder the events
   */
  const handleOnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over?.id) {
      if (active.id !== over?.id) {
        const fromIndex = active.data.current?.sortable.index;
        const toIndex = over.data.current?.sortable.index;

        // we keep a copy of the state as a hack to handle inconsistencies between dnd-kit and async store updates
        setSortableData((currentEntries) => {
          return reorderArray(currentEntries, fromIndex, toIndex);
        });
        reorderEntry(String(active.id), fromIndex, toIndex);
      }
    }
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
    return <RundownEmpty handleAddNew={() => insertAtId({ type: SupportedEntry.Event }, cursor)} />;
  }

  // 1. gather presentation options
  const isEditMode = appMode === AppMode.Edit;

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
            {sortableData.map((entryId, index) => {
              const isFirst = index === 0;
              const isLast = index === sortableData.length - 1;

              // the entry might be a pseudo block-end which does not generate metadata and should not be processed
              if (entryId.startsWith('end-')) {
                const parentId = entryId.split('end-')[1];
                const isBlockCollapsed = getIsCollapsed(parentId);

                if (isBlockCollapsed && isEditMode && isLast) {
                  return <QuickAddBlock key={entryId} previousEventId={parentId} parentBlock={null} />;
                } else {
                  const parentColour = (entries[parentId] as OntimeBlock | undefined)?.colour;
                  // if the previous element is selected, it will have its own QuickAddBlock
                  // we use thisId instead of previousEntryId because the block end does not process
                  // and it does not cause the reassignment of the iteration id to the previous entry
                  const showPrependingQuickAdd = isEditMode && cursor !== rundownMetadata.thisId;
                  return (
                    <Fragment key={entryId}>
                      {showPrependingQuickAdd && (
                        <QuickAddBlock
                          previousEventId={rundownMetadata.thisId}
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
               * we default to $gray-1050 #303030
               */
              const blockColour = rundownMetadata.groupColour === '' ? '#303030' : rundownMetadata.groupColour;

              return (
                <Fragment key={entry.id}>
                  {isEditMode && (hasCursor || isFirst) && (
                    <QuickAddBlock
                      previousEventId={rundownMetadata.previousEntryId}
                      parentBlock={isFirst ? null : rundownMetadata.groupId}
                      backgroundColor={isFirst ? undefined : blockColour}
                    />
                  )}
                  {isOntimeBlock(entry) ? (
                    <BlockBlock
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
                      {isOntimeEvent(entry) && <div className={style.entryIndex}>{rundownMetadata.eventIndex}</div>}
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
                  {isEditMode && (hasCursor || isLast) && (
                    <QuickAddBlock
                      previousEventId={entry.id}
                      parentBlock={rundownMetadata.groupId}
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
