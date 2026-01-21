import { type HTMLProps, forwardRef, Fragment, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TbFlagFilled } from 'react-icons/tb';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { type EntryId, type Rundown, isOntimeEvent, isOntimeGroup, Playback, SupportedEntry } from 'ontime-types';

import { useEntryActionsContext } from '../../common/context/EntryActionsContext';
import { useEntryCopy } from '../../common/stores/entryCopyStore';
import { lastMetadataKey, RundownMetadataObject } from '../../common/utils/rundownMetadata';
import { AppMode } from '../../ontimeConfig';

import QuickAddButtons from './entry-editor/quick-add-buttons/QuickAddButtons';
import QuickAddInline from './entry-editor/quick-add-cursor/QuickAddInline';
import { useRundownCommands } from './hooks/useRundownCommands';
import { useRundownDnd } from './hooks/useRundownDnd';
import { useRundownKeyboard } from './hooks/useRundownKeyboard';
import RundownGroup from './rundown-group/RundownGroup';
import RundownGroupEnd from './rundown-group/RundownGroupEnd';
import { filterVisibleEntries, makeSortableList } from './rundown.utils';
import RundownEmpty from './RundownEmpty';
import { useCollapsedGroups } from './useCollapsedGroups';
import { useEditorFollowMode } from './useEditorFollowMode';
import { useEventSelection } from './useEventSelection';

import style from './Rundown.module.scss';

const RundownEntry = lazy(() => import('./RundownEntry'));

interface RundownProps {
  entries: Rundown['entries'];
  id: Rundown['id'];
  order: Rundown['order'];
  flatOrder: Rundown['flatOrder'];
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
  const setEntryCopyId = useEntryCopy((state) => state.setEntryCopyId);

  // cursor
  const { editorMode } = useEditorFollowMode();

  const clearSelectedEvents = useEventSelection((state) => state.clearSelectedEvents);
  const cursor = useEventSelection((state) => state.cursor);
  const scrollToEntry = useEventSelection((state) => state.scrollToEntry);
  const setScrollHandler = useEventSelection((state) => state.setScrollHandler);
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

  // Keyboard shortcuts
  useRundownKeyboard({
    cursor,
    commands,
    clearSelectedEvents,
    setEntryCopyId,
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

  // Provide an imperative scroll handler for explicit jumps (finder/keyboard)
  useEffect(() => {
    setScrollHandler((entryId) => {
      if (!virtuosoRef.current || dnd.isDraggingRef.current) {
        return;
      }
      const index = visibleData.indexOf(entryId);
      if (index === -1) {
        return;
      }
      virtuosoRef.current.scrollToIndex({
        index,
        align: 'start',
        behavior: 'smooth',
        offset: -100, // show the previous entry for context
      });
    });

    return () => {
      setScrollHandler(null);
    };
  }, [visibleData, dnd.isDraggingRef, setScrollHandler]);

  // Auto-follow behavior in Edit mode: follow the user's cursor
  useEffect(() => {
    if (dnd.isDraggingRef.current || editorMode !== AppMode.Edit || !cursor) {
      return;
    }

    // Open parent group if the target is inside a collapsed group
    const entry = entries[cursor];
    if (entry && 'parent' in entry) {
      expandGroup(entry.parent);
    }
    scrollToEntry(cursor);
  }, [editorMode, cursor, entries, expandGroup, scrollToEntry, dnd.isDraggingRef]);

  // Auto-follow behavior in Run mode: follow the currently playing event
  useEffect(() => {
    if (dnd.isDraggingRef.current || editorMode !== AppMode.Run || !featureData?.selectedEventId) {
      return;
    }

    // Open parent group if the target is inside a collapsed group
    const entry = entries[featureData.selectedEventId];
    if (entry && 'parent' in entry) {
      expandGroup(entry.parent);
    }
    scrollToEntry(featureData.selectedEventId);
  }, [editorMode, featureData?.selectedEventId, entries, expandGroup, scrollToEntry, dnd.isDraggingRef]);

  // gather presentation options
  const isEditMode = editorMode === AppMode.Edit;

  // gather rundown wide data
  const lastEntryId = order.at(-1);

  // Extract primitive values from featureData to avoid unnecessary callback recreations
  const nextEventId = featureData?.nextEventId;
  const playback = featureData?.playback;

  // Virtuoso item renderer
  const itemContent = useCallback(
    (index: number, entryId: EntryId) => {
      // Handle end-group pseudo entries
      const isEndGroup = entryId.startsWith('end-');

      if (isEndGroup) {
        const parentId = entryId.split('end-')[1];
        const parentMetadata = metadata[parentId];

        return (
          <Fragment key={entryId}>
            {isEditMode && parentMetadata?.groupEntries === 0 && (
              <QuickAddButtons
                previousEventId={null}
                parentGroup={parentId}
                backgroundColor={parentMetadata?.groupColour}
              />
            )}
            <RundownGroupEnd key={entryId} id={entryId} colour={parentMetadata?.groupColour} />
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

      return (
        <Fragment key={entry.id}>
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
                  loaded={entryMetadata.isLoaded}
                  hasCursor={hasCursor}
                  isNext={isNext}
                  isNextDay={entryMetadata.isNextDay}
                  playback={entryMetadata.isLoaded ? playback : undefined}
                  isRolling={playback === Playback.Roll}
                  totalGap={entryMetadata.totalGap}
                  isLinkedToLoaded={entryMetadata.isLinkedToLoaded}
                />
              </div>
            </div>
          )}
          {/* QuickAddInline after the entry - edit mode only, if there is a cursor, if it is not the last entry */}
          {isEditMode && hasCursor && !isLast && (
            <QuickAddInline placement='after' referenceEntryId={entry.id} parentGroup={parentIdForAfter} />
          )}
        </Fragment>
      );
    },
    [entries, metadata, getIsCollapsed, isEditMode, cursor, nextEventId, playback, lastEntryId, handleCollapseGroup],
  );

  if (sortableData.length < 1) {
    return <RundownEmpty handleAddNew={(type: SupportedEntry) => entryActions.addEntry({ type })} />;
  }

  return (
    <div className={style.rundownContainer} ref={scrollRef} data-testid='rundown'>
      <DndContext
        onDragEnd={dnd.handleOnDragEnd}
        onDragStart={dnd.collapseDraggedGroups}
        onDragOver={dnd.expandOverGroup}
        sensors={dnd.sensors}
        collisionDetection={closestCenter}
      >
        <SortableContext items={sortableData} strategy={verticalListSortingStrategy}>
          <Virtuoso
            ref={virtuosoRef}
            data={visibleData}
            computeItemKey={(_index, entryId) => entryId}
            itemContent={itemContent}
            increaseViewportBy={{ top: 200, bottom: 400 }}
            style={{ height: '100%' }}
            components={{
              Header: isEditMode ? () => <QuickAddButtons previousEventId={null} parentGroup={null} /> : undefined,
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
      </DndContext>
    </div>
  );
}

// Virtuoso components - extracted to prevent recreation on every render
const VirtuosoListComponent = forwardRef<HTMLDivElement, HTMLProps<HTMLDivElement>>(({ children, ...props }, ref) => (
  <div ref={ref} className={style.list} {...props}>
    {children}
  </div>
));
VirtuosoListComponent.displayName = 'VirtuosoListComponent';
