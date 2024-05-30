import { Fragment, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useHotkeys } from '@mantine/hooks';
import { isOntimeEvent, MaybeNumber, Playback, RundownCached, SupportedEvent } from 'ontime-types';
import { getFirstNormal, getLastNormal, getNextNormal, getPreviousNormal } from 'ontime-utils';

import { useEventAction } from '../../common/hooks/useEventAction';
import useFollowComponent from '../../common/hooks/useFollowComponent';
import { useRundownEditor } from '../../common/hooks/useSocket';
import { AppMode, useAppMode } from '../../common/stores/appModeStore';
import { useEntryCopy } from '../../common/stores/entryCopyStore';
import { cloneEvent } from '../../common/utils/eventsManager';

import QuickAddBlock from './quick-add-block/QuickAddBlock';
import RundownEmpty from './RundownEmpty';

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
  const { cursor, mode: appMode, setCursor } = useAppMode();
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useFollowComponent({ followRef: cursorRef, scrollRef, doFollow: appMode === AppMode.Run });

  // DND KIT
  const sensors = useSensors(useSensor(PointerSensor));

  const deleteAtCursor = useCallback(
    (cursor: string | null) => {
      if (!cursor) return;
      const previous = getPreviousNormal(rundown, order, cursor).entry?.id ?? null;
      deleteEvent([cursor]);
      setCursor(previous);
    },
    [deleteEvent, order, rundown, setCursor],
  );

  const insertCopyAtCursor = useCallback(
    (above = false) => {
      const adjustedCursor = above ? getPreviousNormal(rundown, order, cursor ?? '').entry?.id ?? null : cursor;
      if (entryCopyId === null) {
        // we cant clone without selection
        return;
      }
      const cloenEntry = rundown[entryCopyId];
      if (cloenEntry?.type === SupportedEvent.Event) {
        //TODO: we only clone events
        //if we don't have a cursor add it to the top
        const newEvent = cloneEvent(cloenEntry, adjustedCursor ?? undefined);
        addEvent(newEvent);
      }
    },
    [addEvent, cursor, entryCopyId, order, rundown],
  );

  const insertAtCursor = useCallback(
    (type: SupportedEvent, above = false) => {
      const adjustedCursor = above ? getPreviousNormal(rundown, order, cursor ?? '').entry?.id ?? null : cursor;
      if (adjustedCursor === null) {
        // the only thing to do is adding an event at top
        addEvent({ type });
        return;
      }

      if (type === SupportedEvent.Event) {
        const newEvent = {
          type: SupportedEvent.Event,
        };
        const options = {
          after: adjustedCursor,
          //TODO: this might be incorrect
          lastEventId: adjustedCursor,
        };
        addEvent(newEvent, options);
      } else {
        addEvent({ type }, { after: adjustedCursor });
      }
    },
    [rundown, order, cursor, addEvent],
  );

  const selectEntry = useCallback(
    (cursor: string | null, direction: 'up' | 'down') => {
      if (order.length < 1) {
        return;
      }
      let newCursor: string | undefined;
      if (cursor === null) {
        // there is no cursor, we select the first or last depending on direction if it exists
        newCursor = direction === 'up' ? getLastNormal(rundown, order)?.id : getFirstNormal(rundown, order)?.id;
      } else {
        // otherwise we select the next or previous
        newCursor =
          direction === 'up'
            ? getPreviousNormal(rundown, order, cursor).entry?.id
            : getNextNormal(rundown, order, cursor).entry?.id;
      }

      if (newCursor) {
        setCursor(newCursor);
      }
    },
    [order, rundown, setCursor],
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
    ['alt + mod + ArrowDown', () => moveEntry(cursor, 'down'), { preventDefault: true }],
    ['alt + mod + ArrowUp', () => moveEntry(cursor, 'up'), { preventDefault: true }],

    ['Escape', () => setCursor(null), { preventDefault: true }],

    ['mod + Backspace', () => deleteAtCursor(cursor), { preventDefault: true }],

    ['alt + E', () => insertAtCursor(SupportedEvent.Event), { preventDefault: true }],
    ['alt + shift + E', () => insertAtCursor(SupportedEvent.Event, true), { preventDefault: true }],

    ['alt + B', () => insertAtCursor(SupportedEvent.Block), { preventDefault: true }],
    ['alt + shift + B', () => insertAtCursor(SupportedEvent.Block, true), { preventDefault: true }],

    ['alt + D', () => insertAtCursor(SupportedEvent.Delay), { preventDefault: true }],
    ['alt + shift + D', () => insertAtCursor(SupportedEvent.Delay, true), { preventDefault: true }],

    ['mod + C', () => setEntryCopyId(cursor), { preventDefault: true }],
    ['mod + V', () => insertCopyAtCursor(), { preventDefault: true }],
    ['mod + shift + V', () => insertCopyAtCursor(true), { preventDefault: true }],

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
    setCursor(featureData.selectedEventId);
  }, [appMode, featureData.selectedEventId, setCursor]);

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
    return <RundownEmpty handleAddNew={() => insertAtCursor(SupportedEvent.Event)} />;
  }

  let previousStart: MaybeNumber = null;
  let previousEnd: MaybeNumber = null;
  let previousEventId: string | undefined;
  let thisStart: MaybeNumber = null;
  let thisEnd: MaybeNumber = null;
  let thisId = previousEventId;

  let eventIndex = 0;
  // all events before the current selected are in the past
  let isPast = Boolean(featureData?.selectedEventId);

  const isEditMode = appMode === AppMode.Edit;

  return (
    <div className={style.rundownContainer} ref={scrollRef} data-testid='rundown'>
      <DndContext onDragEnd={handleOnDragEnd} sensors={sensors} collisionDetection={closestCenter}>
        <SortableContext items={statefulEntries} strategy={verticalListSortingStrategy}>
          <div className={style.list}>
            {statefulEntries.map((eventId, index) => {
              // we iterate through a stateful copy of order to make the operations smoother
              // this means that this can be out of sync with order until the useEffect runs
              // instead of writing all the logic guards, we simply short circuit rendering here
              const event = rundown[eventId];
              if (!event) {
                return null;
              }
              if (index === 0) {
                eventIndex = 0;
              }
              if (isOntimeEvent(event)) {
                // event indexes are 1 based in frontend
                eventIndex++;
                previousStart = thisStart;
                previousEnd = thisEnd;
                previousEventId = thisId;

                if (!event.skip) {
                  thisStart = event.timeStart;
                  thisEnd = event.timeEnd;
                  thisId = eventId;
                }
              }
              const isFirst = index === 0;
              const isLast = index === order.length - 1;
              const isLoaded = featureData?.selectedEventId === event.id;
              const isNext = featureData?.nextEventId === event.id;
              const hasCursor = event.id === cursor;
              if (isLoaded) {
                isPast = false;
              }

              return (
                <Fragment key={event.id}>
                  {isEditMode && (hasCursor || isFirst) && <QuickAddBlock previousEventId={previousEventId} />}
                  <div className={style.entryWrapper} data-testid={`entry-${eventIndex}`}>
                    {isOntimeEvent(event) && <div className={style.entryIndex}>{eventIndex}</div>}
                    <div className={style.entry} key={event.id} ref={hasCursor ? cursorRef : undefined}>
                      <RundownEntry
                        type={event.type}
                        isPast={isPast}
                        eventIndex={eventIndex}
                        data={event}
                        loaded={isLoaded}
                        hasCursor={hasCursor}
                        isNext={isNext}
                        previousStart={previousStart}
                        previousEnd={previousEnd}
                        previousEventId={previousEventId}
                        playback={isLoaded ? featureData.playback : undefined}
                        isRolling={featureData.playback === Playback.Roll}
                      />
                    </div>
                  </div>
                  {isEditMode && (hasCursor || isLast) && <QuickAddBlock previousEventId={event.id} />}
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
