import { Fragment, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useHotkeys } from '@mantine/hooks';
import {
  type EntryId,
  type MaybeString,
  type PlayableEvent,
  type Rundown,
  isOntimeBlock,
  isOntimeEvent,
  isPlayableEvent,
  Playback,
  SupportedEvent,
} from 'ontime-types';
import {
  checkIsNextDay,
  getFirstNormal,
  getLastNormal,
  getNextBlockNormal,
  getNextNormal,
  getPreviousBlockNormal,
  getPreviousNormal,
  isNewLatest,
  reorderArray,
} from 'ontime-utils';

import { type EventOptions, useEventAction } from '../../common/hooks/useEventAction';
import useFollowComponent from '../../common/hooks/useFollowComponent';
import { useRundownEditor } from '../../common/hooks/useSocket';
import { AppMode, useAppMode } from '../../common/stores/appModeStore';
import { useEntryCopy } from '../../common/stores/entryCopyStore';
import { cloneEvent } from '../../common/utils/eventsManager';

import QuickAddBlock from './quick-add-block/QuickAddBlock';
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
  const { addEvent, reorderEvent, deleteEvent } = useEventAction();

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
      deleteEvent([cursor]);
      if (entry && index !== null) {
        setSelectedEvents({ id: entry.id, selectMode: 'click', index });
      }
    },
    [entries, order, deleteEvent, setSelectedEvents],
  );

  const insertCopyAtId = useCallback(
    (atId: string | null, copyId: string | null, above = false) => {
      const adjustedCursor = above ? getPreviousNormal(entries, order, atId ?? '').entry?.id ?? null : atId;
      if (copyId === null) {
        // we cant clone without selection
        return;
      }
      const cloneEntry = entries[copyId];
      if (cloneEntry?.type === SupportedEvent.Event) {
        //if we don't have a cursor add the new event on top
        const newEvent = cloneEvent(cloneEntry);
        addEvent(newEvent, { after: adjustedCursor ?? undefined });
      }
    },
    [addEvent, order, entries],
  );

  const insertAtId = useCallback(
    (type: SupportedEvent, id: MaybeString, above = false) => {
      const options: EventOptions =
        id === null
          ? {}
          : {
              after: above ? undefined : id,
              before: above ? id : undefined,
            };

      if (type === SupportedEvent.Event) {
        const newEvent = {
          type: SupportedEvent.Event,
        };
        if (!above && id) {
          options.lastEventId = id;
        }
        addEvent(newEvent, options);
      } else {
        addEvent({ type }, options);
      }
    },
    [addEvent],
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
        reorderEvent(cursor, offsetIndex, index);
      }
    },
    [order, reorderEvent, entries],
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

    ['alt + E', () => insertAtId(SupportedEvent.Event, cursor), { preventDefault: true }],
    ['alt + shift + E', () => insertAtId(SupportedEvent.Event, cursor, true), { preventDefault: true }],

    ['alt + B', () => insertAtId(SupportedEvent.Block, cursor), { preventDefault: true }],
    ['alt + shift + B', () => insertAtId(SupportedEvent.Block, cursor, true), { preventDefault: true }],

    ['alt + D', () => insertAtId(SupportedEvent.Delay, cursor), { preventDefault: true }],
    ['alt + shift + D', () => insertAtId(SupportedEvent.Delay, cursor, true), { preventDefault: true }],

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
        reorderEvent(String(active.id), fromIndex, toIndex);
      }
    }
  };

  if (statefulEntries.length < 1) {
    return <RundownEmpty handleAddNew={() => insertAtId(SupportedEvent.Event, cursor)} />;
  }

  // last event is used to calculate relative timings
  let lastEvent: PlayableEvent | null = null; // used by indicators
  let thisEvent: PlayableEvent | null = null;
  // previous entry is used to infer position in the rundown for new events
  let previousEntryId: MaybeString = null;
  let thisId: MaybeString = null;

  let eventIndex = 0;
  // all events before the current selected are in the past
  let isPast = Boolean(featureData?.selectedEventId);
  let isNextDay = false;
  let totalGap = 0;
  const isEditMode = appMode === AppMode.Edit;
  let isLinkedToLoaded = true; //check if the event can link all the way back to the currently playing event

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
              if (index === 0) {
                eventIndex = 0;
              }
              isNextDay = false;
              previousEntryId = thisId;
              thisId = entryId;
              if (isOntimeEvent(entry)) {
                // event indexes are 1 based in frontend
                eventIndex++;
                lastEvent = thisEvent;

                if (isPlayableEvent(entry)) {
                  isNextDay = checkIsNextDay(entry, lastEvent);
                  if (!isPast) {
                    totalGap += entry.gap;
                    isLinkedToLoaded = isLinkedToLoaded && entry.linkStart !== null;
                  }
                  if (isNewLatest(entry, lastEvent)) {
                    // populate previous entry
                    thisEvent = entry;
                  }
                }
              }
              const isFirst = index === 0;
              const isLast = index === order.length - 1;
              const isLoaded = featureData?.selectedEventId === entry.id;
              const isNext = featureData?.nextEventId === entry.id;
              const hasCursor = entry.id === cursor;
              if (isLoaded) {
                isPast = false;
              }

              return (
                <Fragment key={entry.id}>
                  {isEditMode && (hasCursor || isFirst) && <QuickAddBlock previousEventId={previousEntryId} />}
                  <div className={style.entryWrapper} data-testid={`entry-${eventIndex}`}>
                    {isOntimeEvent(entry) && <div className={style.entryIndex}>{eventIndex}</div>}
                    <div className={style.entry} key={entry.id} ref={hasCursor ? cursorRef : undefined}>
                      <RundownEntry
                        type={entry.type}
                        isPast={isPast}
                        eventIndex={eventIndex}
                        data={entry}
                        loaded={isLoaded}
                        hasCursor={hasCursor}
                        isNext={isNext}
                        previousEntryId={previousEntryId}
                        previousEventId={lastEvent?.id}
                        playback={isLoaded ? featureData.playback : undefined}
                        isRolling={featureData.playback === Playback.Roll}
                        isNextDay={isNextDay}
                        totalGap={totalGap}
                        isLinkedToLoaded={isLinkedToLoaded}
                      />
                    </div>
                  </div>
                  {isEditMode && (hasCursor || isLast) && <QuickAddBlock previousEventId={entry.id} />}
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
