import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, type SortingStrategy } from '@dnd-kit/sortable';
import {
  type EntryId,
  Playback,
  type Rundown as RundownType,
  SupportedEntry,
  isOntimeEvent,
  isOntimeGroup,
} from 'ontime-types';
import { Fragment, type HTMLProps, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TbFlagFilled } from 'react-icons/tb';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import EmptyRundown from '../../common/components/state/EmptyRundown';
import { useEntryActionsContext } from '../../common/context/EntryActionsContext';
import { useRundownScope } from '../../common/context/RundownScopeContext';
import useAutomationSettings from '../../common/hooks-query/useAutomationSettings';
import { useSetEntryCopy } from '../../common/stores/entryCopyStore';
import { RundownMetadataObject, lastMetadataKey } from '../../common/utils/rundownMetadata';
import { AppMode } from '../../ontimeConfig';
import QuickAddButtons from './entry-editor/quick-add-buttons/QuickAddButtons';
import QuickAddInline from './entry-editor/quick-add-cursor/QuickAddInline';
import { useListFollow } from './hooks/useListFollow';
import { useRundownCommands } from './hooks/useRundownCommands';
import { useRundownDnd } from './hooks/useRundownDnd';
import { useRundownKeyboard } from './hooks/useRundownKeyboard';
import RundownDragPreview from './rundown-drag-preview/RundownDragPreview';
import { getGroupDurationFit } from './rundown-event/rundownEvent.utils';
import RundownGroup from './rundown-group/RundownGroup';
import RundownGroupEnd from './rundown-group/RundownGroupEnd';
import { filterVisibleEntries, makeSortableList } from './rundown.utils';
import RundownEntry from './RundownEntry';
import { useCollapsedGroups } from './useCollapsedGroups';
import { useEditorFollowMode } from './useEditorFollowMode';
import { useEventSelection } from './useEventSelection';

import style from './Rundown.module.scss';

interface RundownProps {
  entries: RundownType['entries'];
  id: RundownType['id'];
  order: RundownType['order'];
  flatOrder: RundownType['flatOrder'];
  rundownMetadata: RundownMetadataObject;
  featureData: {
    playback: Playback;
    selectedEventId: EntryId | null;
    nextEventId: EntryId | null;
  };
}

export default function Rundown({ order, flatOrder, entries, id, rundownMetadata, featureData }: RundownProps) {
  // invoke the compiler for the component
  'use memo';

  const { data: automationSettings, status: automationStatus } = useAutomationSettings();
  const automationsEnabled = automationStatus === 'pending' ? undefined : automationSettings.enabledAutomations;
  const [sortableData, setSortableData] = useState<EntryId[]>(() => makeSortableList(order, entries));
  const [metadata, setMetadata] = useState<RundownMetadataObject>(rundownMetadata);

  /**
   * We need to keep a copy of the events we receive to
   * workaround issues with dnd-kit optimistic updates
   */
  useEffect(() => {
    setSortableData(makeSortableList(order, entries));
    setMetadata(rundownMetadata);
  }, [order, entries, rundownMetadata]);

  const { getIsCollapsed, collapseGroup, expandGroup } = useCollapsedGroups(id);

  const entryActions = useEntryActionsContext();
  const { selectionStore } = useRundownScope();
  const setEntryCopyId = useSetEntryCopy();

  // cursor
  const { editorMode } = useEditorFollowMode();

  const clearSelectedEvents = useEventSelection((state) => state.clearSelectedEvents);
  const cursor = useEventSelection((state) => state.cursor);
  const selectEntry = useEventSelection((state) => state.setSelectedEvents);

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const virtuosoRef = useRef<VirtuosoHandle | null>(null);

  /**
   * Handles logic for collapsing groups
   */
  const handleCollapseGroup = useCallback(
    (collapsed: boolean, groupId: EntryId | undefined) => {
      if (collapsed) {
        collapseGroup(groupId);
      } else {
        expandGroup(groupId);
      }
    },
    [collapseGroup, expandGroup],
  );

  // Commands layer - business logic
  const commands = useRundownCommands({
    entries,
    flatOrder,
    entryActions,
    selectEntry,
    handleCollapseGroup,
  });

  // DND handlers
  const dnd = useRundownDnd({
    entries,
    sortableData,
    setSortableData,
    getIsCollapsed,
    handleCollapseGroup,
    entryActions,
  });

  // Filter visible data to exclude collapsed items
  // DND-kit (SortableContext) needs the full sortableData for drag calculations
  // Virtuoso only renders visibleData to avoid null items that reserve space
  const visibleData = useMemo(() => {
    return filterVisibleEntries(sortableData, entries, getIsCollapsed);
  }, [sortableData, entries, getIsCollapsed]);

  // Reveal targets inside a collapsed group wait for it to expand.
  const prepareReveal = useCallback(
    (entryId: EntryId) => {
      const entry = entries[entryId];
      if (entry && 'parent' in entry && entry.parent && getIsCollapsed(entry.parent)) {
        expandGroup(entry.parent);
        return false;
      }
      return true;
    },
    [entries, getIsCollapsed, expandGroup],
  );

  const { scrollerRef, reveal, resume, followMove } = useListFollow({
    listRef: virtuosoRef,
    ids: visibleData,
    liveId: featureData.selectedEventId,
    isRunMode: editorMode === AppMode.Run,
    offset: 100,
    behavior: 'smooth',
    blockedRef: dnd.isDraggingRef,
    prepare: prepareReveal,
  });

  const liveEntry = featureData.selectedEventId ? entries[featureData.selectedEventId] : undefined;
  const liveParentId = liveEntry && 'parent' in liveEntry ? liveEntry.parent : null;

  // Jump to the current element on demand: the running event in Run mode, the edit cursor otherwise.
  // Scrolls only (no selection change) so jumping to the running event does not hijack the edit cursor.
  const jumpToCurrent = useCallback(() => {
    if (editorMode === AppMode.Run) {
      expandGroup(liveParentId);
      resume();
    } else {
      reveal(cursor);
    }
  }, [editorMode, liveParentId, cursor, expandGroup, resume, reveal]);

  // Keyboard shortcuts
  useRundownKeyboard({
    cursor,
    commands,
    clearSelectedEvents,
    setEntryCopyId,
    jumpToCurrent,
    followMove,
  });

  // Entering Edit mode reveals the cursor through the same path as finder and keyboard navigation.
  useEffect(() => {
    if (editorMode === AppMode.Edit) {
      reveal(selectionStore.getState().cursor);
    }
  }, [editorMode, selectionStore, reveal]);

  // The selection and, in Run, the live event stay visible when they move into a collapsed group.
  // Both are keyed on the parent, so edits and a group the user collapses do not re-open it.
  const cursorEntry = cursor ? entries[cursor] : undefined;
  const cursorParentId = cursorEntry && 'parent' in cursorEntry ? cursorEntry.parent : null;
  // open the group the selection moved into
  useEffect(() => {
    if (!dnd.isDraggingRef.current) {
      expandGroup(cursorParentId);
    }
  }, [cursorParentId, expandGroup, dnd.isDraggingRef]);

  const isRunMode = editorMode === AppMode.Run;
  // in Run, open the group the live event moved into
  useEffect(() => {
    if (isRunMode && !dnd.isDraggingRef.current) {
      expandGroup(liveParentId);
    }
  }, [isRunMode, liveParentId, expandGroup, dnd.isDraggingRef]);

  // gather presentation options
  const isEditMode = editorMode === AppMode.Edit;

  const draggedEntry = dnd.activeId ? entries[dnd.activeId] : undefined;
  const dropTarget = dnd.dropTarget;

  // gather rundown wide data
  const lastEntryId = order.at(-1);

  // Extract primitive values from featureData to avoid unnecessary callback recreations
  const nextEventId = featureData?.nextEventId;
  const playback = featureData?.playback;

  // Virtuoso item renderer
  const itemContent = useCallback(
    (index: number, entryId: EntryId) => {
      const dropLineBefore = dropTarget?.id === entryId && dropTarget.placement === 'before';
      const dropLineAfter = dropTarget?.id === entryId && dropTarget.placement === 'after';

      // Handle end-group pseudo entries
      const isEndGroup = entryId.startsWith('end-');

      if (isEndGroup) {
        const parentId = entryId.split('end-')[1];
        const parentMetadata = metadata[parentId];

        return (
          <Fragment key={entryId}>
            {dropLineBefore && <div className={style.dropLine} />}
            {isEditMode && parentMetadata?.groupEntries === 0 && (
              <QuickAddButtons
                previousEventId={null}
                parentGroup={parentId}
                backgroundColor={parentMetadata?.groupColour}
              />
            )}
            <RundownGroupEnd key={entryId} id={entryId} colour={parentMetadata?.groupColour} />
            {dropLineAfter && <div className={style.dropLine} />}
          </Fragment>
        );
      }

      const entry = entries[entryId];
      const entryMetadata = metadata[entryId];

      if (!entry || !entryMetadata) {
        return null;
      }

      const isNext = nextEventId === entry.id;
      const hasCursor = entry.id === cursor;
      const isGroup = isOntimeGroup(entry);
      const groupColour = entryMetadata.groupColour === '' ? '#9d9d9d' : entryMetadata.groupColour;
      const isFirst = index === 0;
      const isLast = entryId === lastEntryId;
      const parentIdForBefore = entryMetadata.thisId !== entryMetadata.groupId ? entryMetadata.groupId : null;
      const parentIdForAfter = entryMetadata.groupId;
      const collapsed = isGroup ? getIsCollapsed(entry.id) : false;
      const parentGroup = isOntimeEvent(entry) && entry.parent ? entries[entry.parent] : null;

      return (
        <Fragment key={entry.id}>
          {dropLineBefore && <div className={style.dropLine} />}
          {/* QuickAddInline before the entry - edit mode only, if there is a cursor, if it is not the first entry */}
          {isEditMode && hasCursor && !isFirst && (
            <QuickAddInline placement='before' referenceEntryId={entry.id} parentGroup={parentIdForBefore} />
          )}
          {isGroup ? (
            <RundownGroup data={entry} hasCursor={hasCursor} collapsed={collapsed} onCollapse={handleCollapseGroup} />
          ) : (
            <div
              className={style.entryWrapper}
              data-testid={`entry-${entryMetadata.eventIndex}`}
              style={groupColour ? { '--user-bg': groupColour } : {}}
            >
              {isOntimeEvent(entry) && (
                <div className={style.entryIndex}>
                  {entry.flag && <TbFlagFilled className={style.flag} />}
                  <div className={style.index}>{entryMetadata.eventIndex}</div>
                </div>
              )}
              <div className={style.entry} key={entry.id} ref={hasCursor ? cursorRef : undefined}>
                <RundownEntry
                  type={entry.type}
                  isPast={entryMetadata.isPast}
                  eventIndex={entryMetadata.eventIndex}
                  data={entry}
                  automationsEnabled={automationsEnabled}
                  loaded={entryMetadata.isLoaded}
                  hasCursor={hasCursor}
                  isNext={isNext}
                  isNextDay={entryMetadata.isNextDay}
                  playback={entryMetadata.isLoaded ? playback : undefined}
                  isRolling={playback === Playback.Roll}
                  totalGap={entryMetadata.totalGap}
                  isLinkedToLoaded={entryMetadata.isLinkedToLoaded}
                  groupDurationFit={isOntimeGroup(parentGroup) ? getGroupDurationFit(parentGroup) : null}
                />
              </div>
            </div>
          )}
          {/* QuickAddInline after the entry - edit mode only, if there is a cursor, if it is not the last entry */}
          {isEditMode && hasCursor && !isLast && (
            <QuickAddInline placement='after' referenceEntryId={entry.id} parentGroup={parentIdForAfter} />
          )}
          {dropLineAfter && <div className={style.dropLine} />}
        </Fragment>
      );
    },
    [
      entries,
      metadata,
      getIsCollapsed,
      isEditMode,
      cursor,
      nextEventId,
      playback,
      lastEntryId,
      handleCollapseGroup,
      automationsEnabled,
      dropTarget,
    ],
  );

  if (sortableData.length < 1) {
    return (
      <EmptyRundown handleAddNew={isEditMode ? (type: SupportedEntry) => entryActions.addEntry({ type }) : undefined} />
    );
  }

  return (
    <div className={style.rundownContainer} ref={scrollRef} data-testid='rundown'>
      <DndContext
        onDragEnd={dnd.handleOnDragEnd}
        onDragStart={dnd.handleOnDragStart}
        onDragCancel={dnd.handleOnDragCancel}
        onDragOver={dnd.handleOnDragOver}
        sensors={dnd.sensors}
        collisionDetection={closestCenter}
      >
        <SortableContext items={sortableData} strategy={noSortingStrategy}>
          <Virtuoso
            ref={virtuosoRef}
            scrollerRef={scrollerRef}
            data={visibleData}
            computeItemKey={(_index, entryId) => entryId}
            itemContent={itemContent}
            increaseViewportBy={{ top: 200, bottom: 400 }}
            style={{ height: '100%' }}
            components={{
              Header: isEditMode
                ? () => <QuickAddButtons previousEventId={null} nextEventId={order[0]} parentGroup={null} />
                : undefined,
              Footer: () => (
                <>
                  {isEditMode && (
                    <QuickAddButtons
                      previousEventId={metadata[lastMetadataKey]?.groupId ?? metadata[lastMetadataKey]?.thisId}
                      parentGroup={null}
                    />
                  )}
                  <div className={style.spacer} />
                </>
              ),
              List: VirtuosoListComponent,
            }}
          />
        </SortableContext>
        {/* Portal the overlay so it survives virtualization and layout clipping. */}
        {createPortal(
          <DragOverlay dropAnimation={null}>
            {draggedEntry && (
              <RundownDragPreview
                entry={draggedEntry}
                eventIndex={isOntimeEvent(draggedEntry) ? metadata[draggedEntry.id]?.eventIndex : undefined}
                isValidDrop={dnd.isValidDrop}
              />
            )}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    </div>
  );
}

// Keep entries static; the overlay and drop line indicate the destination.
const noSortingStrategy: SortingStrategy = () => null;

// Virtuoso components - extracted to prevent recreation on every render
const VirtuosoListComponent = forwardRef<HTMLDivElement, HTMLProps<HTMLDivElement>>(({ children, ...props }, ref) => (
  <div ref={ref} {...props} className={style.list}>
    {children}
  </div>
));
VirtuosoListComponent.displayName = 'VirtuosoListComponent';
