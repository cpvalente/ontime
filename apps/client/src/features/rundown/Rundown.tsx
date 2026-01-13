import { type HTMLProps, forwardRef, Fragment, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TbFlagFilled } from 'react-icons/tb';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSessionStorage } from '@mantine/hooks';
import { type EntryId, type Rundown, isOntimeEvent, isOntimeGroup, Playback, SupportedEntry } from 'ontime-types';

import { useEntryActionsContext } from '../../common/context/EntryActionsContext';
import { useEntryCopy } from '../../common/stores/entryCopyStore';
import { lastMetadataKey, RundownMetadataObject } from '../../common/utils/rundownMetadata';
import { AppMode, sessionKeys } from '../../ontimeConfig';

import QuickAddButtons from './entry-editor/quick-add-buttons/QuickAddButtons';
import QuickAddInline from './entry-editor/quick-add-cursor/QuickAddInline';
import { useRundownCommands } from './hooks/useRundownCommands';
import { useRundownDnd } from './hooks/useRundownDnd';
import { useRundownKeyboard } from './hooks/useRundownKeyboard';
import RundownGroup from './rundown-group/RundownGroup';
import RundownGroupEnd from './rundown-group/RundownGroupEnd';
import { filterVisibleEntries, makeSortableList } from './rundown.utils';
import RundownEmpty from './RundownEmpty';
import { useEventSelection } from './useEventSelection';

import style from './Rundown.module.scss';

const RundownEntry = lazy(() => import('./RundownEntry'));

interface RundownProps {
  entries: Rundown['entries'];
  id: Rundown['id'];
  order: Rundown['order'];
  rundownMetadata: RundownMetadataObject;
  featureData: {
    playback: Playback;
    selectedEventId: EntryId | null;
    nextEventId: EntryId | null;
  };
}

export default function Rundown({ order, entries, id, rundownMetadata, featureData }: RundownProps) {
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

  const [collapsedGroups, setCollapsedGroups] = useSessionStorage<EntryId[]>({
    // we ensure that this is unique to the rundown
    key: `rundown.${id}-editor-collapsed-groups`,
    defaultValue: [],
  });
  const collapsedGroupSet = useMemo(() => new Set(collapsedGroups), [collapsedGroups]);

  const entryActions = useEntryActionsContext();
  const setEntryCopyId = useEntryCopy((state) => state.setEntryCopyId);

  // cursor
  const [editorMode] = useSessionStorage<AppMode>({
    key: sessionKeys.editorMode,
    defaultValue: AppMode.Edit,
  });

  const clearSelectedEvents = useEventSelection((state) => state.clearSelectedEvents);
  const setSelectedEvents = useEventSelection((state) => state.setSelectedEvents);
  const cursor = useEventSelection((state) => state.cursor);

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const virtuosoRef = useRef<VirtuosoHandle | null>(null);

  /**
   * Checks whether a group is collapsed
   */
  const getIsCollapsed = useCallback(
    (groupId: EntryId): boolean => {
      return collapsedGroupSet.has(groupId);
    },
    [collapsedGroupSet],
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

  // Commands layer - business logic
  const commands = useRundownCommands({
    entries,
    order,
    entryActions,
    setSelectedEvents,
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

  // Follow-scroll with Virtuoso in run mode
  // Always scrolls when playback selection changes, not during drag operations
  useEffect(() => {
    if (editorMode !== AppMode.Run || !virtuosoRef.current || dnd.isDraggingRef.current) return;

    const targetId = featureData?.selectedEventId;
    if (!targetId) return;

    const index = visibleData.indexOf(targetId);
    if (index === -1) return;

    virtuosoRef.current.scrollToIndex({
      index,
      align: 'start',
      behavior: 'smooth',
      offset: -100,
    });
  }, [editorMode, featureData?.selectedEventId, visibleData, dnd.isDraggingRef]);

  // Scroll to the active cursor when editing (e.g. finder results)
  useEffect(() => {
    if (editorMode !== AppMode.Edit || !virtuosoRef.current || dnd.isDraggingRef.current) return;

    if (!cursor) return;

    const index = visibleData.indexOf(cursor);
    if (index === -1) return;

    virtuosoRef.current.scrollToIndex({
      index,
      align: 'start',
      behavior: 'smooth',
      offset: -100, // show the previous entry for context
    });
  }, [editorMode, cursor, visibleData, dnd.isDraggingRef]);

  // in run mode, we follow the playback selection and open groups as needed
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

      // Regular entry handling - compute all values upfront
      const entry = entries[entryId];
      const entryMetadata = metadata[entryId];

      // Null check after computing - return null if missing
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
