import { Fragment, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useHotkeys } from '@mantine/hooks';
import {
  isOntimeBlock,
  isOntimeEvent,
  isPlayableEvent,
  MaybeString,
  PlayableEvent,
  Playback,
  RundownCached,
  SupportedEvent,
} from 'ontime-types';
import {
  getFirstNormal,
  getLastNormal,
  getNextBlockNormal,
  getNextNormal,
  getPreviousBlockNormal,
  getPreviousNormal,
  isNewLatest,
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
  data: RundownCached;
}

export default function Rundown({ data }: RundownProps) {
  const { order, rundown } = data;
  const [statefulEntries, setStatefulEntries] = useState(order);

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
      const { entry, index } = getPreviousNormal(rundown, order, cursor);
      deleteEvent([cursor]);
      if (entry && index !== null) {
        setSelectedEvents({ id: entry.id, selectMode: 'click', index });
      }
    },
    [rundown, order, deleteEvent, setSelectedEvents],
  );

  const insertCopyAtId = useCallback(
    (atId: string | null, copyId: string | null, above = false) => {
      const adjustedCursor = above ? getPreviousNormal(rundown, order, atId ?? '').entry?.id ?? null : atId;
      if (copyId === null) {
        // we cant clone without selection
        return;
      }
      const cloneEntry = rundown[copyId];
      if (cloneEntry?.type === SupportedEvent.Event) {
        //if we don't have a cursor add the new event on top
        const newEvent = cloneEvent(cloneEntry);
        addEvent(newEvent, { after: adjustedCursor ?? undefined });
      }
    },
    [addEvent, order, rundown],
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
        const selected = direction === 'up' ? getLastNormal(rundown, order) : getFirstNormal(rundown, order);

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
          ? getPreviousBlockNormal(rundown, order, newCursor)
          : getNextBlockNormal(rundown, order, newCursor);

      if (selected.entry !== null && selected.index !== null) {
        setSelectedEvents({ id: selected.entry.id, selectMode: 'click', index: selected.index });
      }
    },
    [order, rundown, setSelectedEvents],
  );

  const selectEntry = useCallback(
    (cursor: string | null, direction: 'up' | 'down') => {
      if (order.length < 1) {
        return;
      }

      if (cursor === null) {
        // there is no cursor, we select the first or last depending on direction if it exists
        const selected = direction === 'up' ? getLastNormal(rundown, order) : getFirstNormal(rundown, order);
        if (selected !== null) {
          setSelectedEvents({ id: selected.id, selectMode: 'click', index: direction === 'up' ? order.length : 0 });
        }
        return;
      }

      // otherwise we select the next or previous
      const selected =
        direction === 'up' ? getPreviousNormal(rundown, order, cursor) : getNextNormal(rundown, order, cursor);

      if (selected.entry !== null && selected.index !== null) {
        setSelectedEvents({ id: selected.entry.id, selectMode: 'click', index: selected.index });
      }
    },
    [order, rundown, setSelectedEvents],
  );

  const moveEntry = useCallback(
    (cursor: string | null, direction: 'up' | 'down') => {
      if (order.length < 2 || cursor == null) {
        return;
      }
      const { index } =
        direction === 'up' ? getPreviousNormal(rundown, order, cursor) : getNextNormal(rundown, order, cursor);

      if (index !== null) {
        const offsetIndex = direction === 'up' ? index + 1 : index - 1;
        reorderEvent(cursor, offsetIndex, index);
      }
    },
    [order, reorderEvent, rundown],
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

  const handleOnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over?.id) {
      if (active.id !== over?.id) {
        const fromIndex = active.data.current?.sortable.index;
        const toIndex = over.data.current?.sortable.index;
        // ugly hack to handle inconsistencies between dnd-kit and async store updates
        setStatefulEntries((currentEntries) => {
          return arrayMove(currentEntries, fromIndex, toIndex);
        });
        reorderEvent(String(active.id), fromIndex, toIndex);
      }
    }
  };

  if (statefulEntries.length < 1) {
    return <RundownEmpty handleAddNew={() => insertAtId(SupportedEvent.Event, cursor)} />;
  }

  // last event is used to calculate relative timings
  let lastEvent: PlayableEvent | undefined; // used by indicators
  let thisEvent: PlayableEvent | undefined;
  // previous entry is used to infer position in the rundown for new events
  let previousEntryId: string | undefined;
  let thisId = previousEntryId;

  let eventIndex = 0;
  // all events before the current selected are in the past
  let isPast = Boolean(featureData?.selectedEventId);

  const isEditMode = appMode === AppMode.Edit;

  return (
    <div className={style.rundownContainer} ref={scrollRef} data-testid='rundown'>
      <DndContext onDragEnd={handleOnDragEnd} sensors={sensors} collisionDetection={closestCenter}>
        <SortableContext items={statefulEntries} strategy={verticalListSortingStrategy}>
          <div className={style.list}>
            {statefulEntries.map((entryId, index) => {
              // we iterate through a stateful copy of order to make the operations smoother
              // this means that this can be out of sync with order until the useEffect runs
              // instead of writing all the logic guards, we simply short circuit rendering here
              const entry = rundown[entryId];
              if (!entry) {
                return null;
              }
              if (index === 0) {
                eventIndex = 0;
              }
              previousEntryId = thisId;
              thisId = entryId;
              if (isOntimeEvent(entry)) {
                // event indexes are 1 based in frontend
                eventIndex++;
                lastEvent = thisEvent;

                if (isPlayableEvent(entry)) {
                  // populate previous entry
                  if (isNewLatest(entry.timeStart, entry.timeEnd, lastEvent?.timeStart, lastEvent?.timeEnd)) {
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
                        previousStart={lastEvent?.timeStart}
                        previousEnd={lastEvent?.timeEnd}
                        previousEntryId={previousEntryId}
                        previousEventId={lastEvent?.id}
                        playback={isLoaded ? featureData.playback : undefined}
                        isRolling={featureData.playback === Playback.Roll}
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
