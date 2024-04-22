import { Fragment, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { isOntimeEvent, MaybeNumber, Playback, RundownCached, SupportedEvent } from 'ontime-types';
import { getFirstNormal, getNextNormal, getPreviousNormal } from 'ontime-utils';

import { useEventAction } from '../../common/hooks/useEventAction';
import useFollowComponent from '../../common/hooks/useFollowComponent';
import { useRundownEditor } from '../../common/hooks/useSocket';
import { AppMode, useAppMode } from '../../common/stores/appModeStore';
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
  const { addEvent, reorderEvent } = useEventAction();

  // cursor
  const { cursor, mode: appMode, setCursor } = useAppMode();
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useFollowComponent({ followRef: cursorRef, scrollRef, doFollow: appMode === AppMode.Run });

  // DND KIT
  const sensors = useSensors(useSensor(PointerSensor));

  const insertAtCursor = useCallback(
    (type: SupportedEvent | 'clone', cursor: string | null) => {
      if (cursor === null) {
        // we cant clone without selection
        if (type === 'clone') {
          return;
        }
        // the only thing to do is adding an event at top
        addEvent({ type });
        return;
      }

      if (type === 'clone') {
        const cursorEvent = rundown[cursor];
        if (cursorEvent?.type === SupportedEvent.Event) {
          const newEvent = cloneEvent(cursorEvent, cursorEvent.id);
          addEvent(newEvent);
        }
      } else if (type === SupportedEvent.Event) {
        const newEvent = {
          type: SupportedEvent.Event,
        };
        const options = {
          after: cursor,
          lastEventId: cursor,
        };
        addEvent(newEvent, options);
      } else {
        addEvent({ type }, { after: cursor });
      }
    },
    [addEvent, rundown],
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // handle held key
      if (event.repeat) return;

      const modKeysAlt = event.altKey && !event.ctrlKey && !event.shiftKey;
      const modKeysCtrlAlt = event.altKey && event.ctrlKey && !event.shiftKey;

      if (modKeysAlt) {
        switch (event.code) {
          case 'ArrowDown': {
            if (order.length < 1) {
              return;
            }
            const nextEvent =
              cursor === null ? getFirstNormal(rundown, order) : getNextNormal(rundown, order, cursor)?.nextEvent;
            if (nextEvent) {
              setCursor(nextEvent.id);
            }
            break;
          }
          case 'ArrowUp': {
            if (order.length < 1) {
              return;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we check for this before
            const previousEvent =
              cursor === null
                ? getFirstNormal(rundown, order)
                : getPreviousNormal(rundown, order, cursor).previousEvent;
            if (previousEvent) {
              setCursor(previousEvent.id);
            }
            break;
          }
          case 'KeyE': {
            event.preventDefault();
            insertAtCursor(SupportedEvent.Event, cursor);
            break;
          }
          case 'KeyD': {
            event.preventDefault();
            insertAtCursor(SupportedEvent.Delay, cursor);
            break;
          }
          case 'KeyB': {
            event.preventDefault();
            insertAtCursor(SupportedEvent.Block, cursor);
            break;
          }
          case 'KeyC': {
            event.preventDefault();
            insertAtCursor('clone', cursor);
            break;
          }
        }
      } else if (modKeysCtrlAlt) {
        if (order.length < 2 || cursor == null) {
          return;
        }
        // Alt + Ctrl + Arrow Down
        if (event.code == 'ArrowDown') {
          const { nextEvent, nextIndex } = getNextNormal(rundown, order, cursor);
          if (nextEvent && nextIndex !== null) {
            reorderEvent(cursor, nextIndex - 1, nextIndex);
          }
          // Alt + Ctrl + Arrow Up
        } else if (event.code == 'ArrowUp') {
          const { previousEvent, previousIndex } = getPreviousNormal(rundown, order, cursor);
          if (previousEvent && previousIndex !== null) {
            reorderEvent(cursor, previousIndex + 1, previousIndex);
          }
        }
      }
    },
    [order, cursor, rundown, setCursor, insertAtCursor, reorderEvent],
  );

  // we copy the state from the store here
  // to workaround async updates on the drag mutations
  useEffect(() => {
    setStatefulEntries(order);
  }, [order]);

  // listen to keys
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

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
    return <RundownEmpty handleAddNew={() => insertAtCursor(SupportedEvent.Event, null)} />;
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
