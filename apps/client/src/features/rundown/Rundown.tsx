import { Fragment, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useHotkeys } from '@mantine/hooks';
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

import { type EventOptions, useEntryActions } from '../../common/hooks/useEntryAction';
import useFollowComponent from '../../common/hooks/useFollowComponent';
import { useRundownEditor } from '../../common/hooks/useSocket';
import { AppMode, useAppMode } from '../../common/stores/appModeStore';
import { useEntryCopy } from '../../common/stores/entryCopyStore';
import { cloneEvent } from '../../common/utils/eventsManager';

import BlockBlock from './block-block/BlockBlock';
import QuickAddBlock from './quick-add-block/QuickAddBlock';
import BlockEmpty from './BlockEmpty';
import { makeRundownMetadata } from './rundown.utils';
import RundownEmpty from './RundownEmpty';
import { useEventSelection } from './useEventSelection';

import style from './Rundown.module.scss';

const RundownEntry = lazy(() => import('./RundownEntry'));

interface RundownProps {
  data: Rundown;
}

export default function Rundown({ data }: RundownProps) {
  const { order, entries } = data;
  const [statefulEntries, setStatefulEntries] = useState<EntryId[]>(order);

  const featureData = useRundownEditor();
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
    setStatefulEntries(order);
  }, [order]);

  useEffect(() => {
    // in run mode, we follow selection
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

    if (over?.id) {
      if (active.id !== over?.id) {
        const fromIndex = active.data.current?.sortable.index;
        const toIndex = over.data.current?.sortable.index;

        // we keep a copy of the state as a hack to handle inconsistencies between dnd-kit and async store updates
        setStatefulEntries((currentEntries) => {
          return reorderArray(currentEntries, fromIndex, toIndex);
        });
        reorderEntry(String(active.id), fromIndex, toIndex);
      }
    }
  };

  if (statefulEntries.length < 1) {
    return <RundownEmpty handleAddNew={() => insertAtId({ type: SupportedEntry.Event }, cursor)} />;
  }

  // 1. gather presentation options
  const isEditMode = appMode === AppMode.Edit;

  // 2. initialise rundown metadata
  const process = makeRundownMetadata(featureData?.selectedEventId);

  return (
    <div className={style.rundownContainer} ref={scrollRef} data-testid='rundown'>
      <DndContext onDragEnd={handleOnDragEnd} sensors={sensors} collisionDetection={closestCenter}>
        <SortableContext items={statefulEntries} strategy={verticalListSortingStrategy}>
          <div className={style.list}>
            {statefulEntries.map((entryId, index) => {
              // we iterate through a stateful copy of order to make the operations smoother
              // this means that this can be out of sync with order until the useEffect runs
              // instead of writing all the logic guards, we simply short circuit rendering here
              const entry = entries[entryId];
              if (!entry) {
                return null;
              }

              const rundownMeta = process(entry);
              const isFirst = index === 0;
              const isLast = index === order.length - 1;
              const isNext = featureData?.nextEventId === entry.id;
              const hasCursor = entry.id === cursor;

              return (
                <Fragment key={entry.id}>
                  {isEditMode && (hasCursor || isFirst) && (
                    <QuickAddBlock previousEventId={rundownMeta.previousEntryId} parentBlock={null} />
                  )}
                  {isOntimeBlock(entry) ? (
                    <BlockBlock data={entry} hasCursor={hasCursor}>
                      {entry.events.length === 0 && (
                        <BlockEmpty
                          handleAddNew={() => insertAtId({ type: SupportedEntry.Event, parent: entry.id }, entry.id)}
                        />
                      )}
                      {entry.events.map((eventId, nestedIndex) => {
                        const nestedEntry = entries[eventId];
                        if (!nestedEntry) {
                          return null;
                        }

                        const nestedRundownMeta = process(nestedEntry);
                        const isFirstInGroup = nestedIndex === 0;
                        const isLastInGroup = nestedIndex === entry.events.length - 1;
                        const hasNestedCursor = nestedEntry.id === cursor;

                        if (!isOntimeEvent(nestedEntry)) {
                          return null;
                        }
                        return (
                          <Fragment key={nestedEntry.id}>
                            {isEditMode && (hasNestedCursor || isFirstInGroup) && (
                              <QuickAddBlock
                                parentBlock={entry.id}
                                previousEventId={nestedRundownMeta.previousEntryId}
                              />
                            )}

                            <div
                              key={nestedEntry.id}
                              className={style.entryWrapper}
                              data-testid={`entry-${nestedRundownMeta.eventIndex}`}
                            >
                              <div className={style.entryIndex}>{nestedRundownMeta.eventIndex}</div>
                              <div className={style.entry} ref={hasNestedCursor ? cursorRef : undefined}>
                                <RundownEntry
                                  key={nestedEntry.id}
                                  type={nestedEntry.type}
                                  isPast={nestedRundownMeta.isPast}
                                  eventIndex={nestedRundownMeta.eventIndex}
                                  data={nestedEntry}
                                  loaded={nestedRundownMeta.isLoaded}
                                  hasCursor={hasNestedCursor}
                                  isNext={isNext}
                                  previousEntryId={nestedRundownMeta.previousEntryId}
                                  previousEventId={nestedRundownMeta.previousEvent?.id}
                                  playback={nestedRundownMeta.isLoaded ? featureData.playback : undefined}
                                  isRolling={featureData.playback === Playback.Roll}
                                  isNextDay={nestedRundownMeta.isNextDay}
                                  totalGap={nestedRundownMeta.totalGap}
                                  isLinkedToLoaded={nestedRundownMeta.isLinkedToLoaded}
                                />
                              </div>
                            </div>
                            {isEditMode && (hasNestedCursor || isLastInGroup) && (
                              <QuickAddBlock parentBlock={entry.id} previousEventId={nestedEntry.id} />
                            )}
                          </Fragment>
                        );
                      })}
                    </BlockBlock>
                  ) : (
                    <div className={style.entryWrapper} data-testid={`entry-${rundownMeta.eventIndex}`}>
                      {isOntimeEvent(entry) && <div className={style.entryIndex}>{rundownMeta.eventIndex}</div>}
                      <div className={style.entry} key={entry.id} ref={hasCursor ? cursorRef : undefined}>
                        <RundownEntry
                          type={entry.type}
                          isPast={rundownMeta.isPast}
                          eventIndex={rundownMeta.eventIndex}
                          data={entry}
                          loaded={rundownMeta.isLoaded}
                          hasCursor={hasCursor}
                          isNext={isNext}
                          previousEntryId={rundownMeta.previousEntryId}
                          previousEventId={rundownMeta.previousEvent?.id}
                          playback={rundownMeta.isLoaded ? featureData.playback : undefined}
                          isRolling={featureData.playback === Playback.Roll}
                          isNextDay={rundownMeta.isNextDay}
                          totalGap={rundownMeta.totalGap}
                          isLinkedToLoaded={rundownMeta.isLinkedToLoaded}
                        />
                      </div>
                    </div>
                  )}
                  {isEditMode && (hasCursor || isLast) && (
                    <QuickAddBlock previousEventId={entry.id} parentBlock={null} />
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
