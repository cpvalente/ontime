import { Fragment, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { GetRundownCached, isOntimeBlock, isOntimeDelay, isOntimeEvent, Playback, SupportedEvent } from 'ontime-types';
import { getFirst, getNext, getPrevious } from 'ontime-utils';

import { useEventAction } from '../../common/hooks/useEventAction';
import useFollowComponent from '../../common/hooks/useFollowComponent';
import { useRundownEditor } from '../../common/hooks/useSocket';
import { AppMode, useAppMode } from '../../common/stores/appModeStore';
import { useEditorSettings } from '../../common/stores/editorSettings';
import { cloneEvent } from '../../common/utils/eventsManager';

import QuickAddBlock from './quick-add-block/QuickAddBlock';
import RundownEmpty from './RundownEmpty';

import style from './Rundown.module.scss';

const RundownEntry = lazy(() => import('./RundownEntry'));

interface RundownProps {
  data: GetRundownCached;
}

export default function Rundown({ data }: RundownProps) {
  const { order, rundown } = data;
  const [statefulEntries, setStatefulEntries] = useState(order);

  const featureData = useRundownEditor();
  const { addEvent, reorderEvent } = useEventAction();
  const eventSettings = useEditorSettings((state) => state.eventSettings);
  const defaultPublic = eventSettings.defaultPublic;
  const startTimeIsLastEnd = eventSettings.startTimeIsLastEnd;
  const showQuickEntry = eventSettings.showQuickEntry;

  // cursor
  const { cursor, mode: appMode } = useAppMode();
  const viewFollowsCursor = appMode === AppMode.Run;
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useFollowComponent({ followRef: cursorRef, scrollRef, doFollow: true });

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
          defaultPublic,
          startTimeIsLastEnd,
          lastEventId: cursor,
          after: cursor,
        };
        addEvent(newEvent, options);
      } else {
        addEvent({ type }, { after: cursor });
      }
    },
    [addEvent, rundown, defaultPublic, startTimeIsLastEnd],
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
            const nextEvent = cursor == null ? getFirst([]) : getNext([], cursor)?.nextEvent;
            //const nextEvent = cursor == null ? getFirst(data) : getNext(data, cursor)?.nextEvent;
            if (nextEvent) {
              // moveCursorTo(nextEvent.id, nextEvent.type === SupportedEvent.Event);
            }
            break;
          }
          case 'ArrowUp': {
            if (order.length < 1) {
              return;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we check for this before
            const previousEvent = cursor == null ? getFirst([]) : getPrevious([], cursor).previousEvent;
            //const previousEvent = cursor == null ? getFirst(data) : getPrevious(data, cursor).previousEvent;
            if (previousEvent) {
              // moveCursorTo(previousEvent.id, previousEvent.type === SupportedEvent.Event);
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
        if (event.code == 'ArrowDown') {
          // const { nextEvent, nextIndex } = getNext(data, cursor);
          const { nextEvent, nextIndex } = getNext([], cursor);
          if (nextEvent && nextIndex !== null) {
            reorderEvent(cursor, nextIndex - 1, nextIndex);
          }
        } else if (event.code == 'ArrowUp') {
          // const { previousEvent, previousIndex } = getPrevious(data, cursor);
          const { previousEvent, previousIndex } = getPrevious([], cursor);
          if (previousEvent && previousIndex !== null) {
            reorderEvent(cursor, previousIndex + 1, previousIndex);
          }
        }
      }
    },
    [cursor, insertAtCursor, order.length, reorderEvent],
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
    if (!viewFollowsCursor || !featureData?.selectedEventId) {
      return;
    }
    // moveCursorTo(featureData.selectedEventId);
  }, [featureData?.selectedEventId, viewFollowsCursor]);

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

  if (statefulEntries?.length < 1) {
    return <RundownEmpty handleAddNew={() => insertAtCursor(SupportedEvent.Event, null)} />;
  }

  let previousEnd: null | number = null;
  let thisEnd = 0;
  let previousEventId: string | undefined;
  let eventIndex = 0;
  let isPast = Boolean(featureData?.selectedEventId);

  return (
    <div className={style.eventContainer} ref={scrollRef} data-testid='rundown'>
      <DndContext onDragEnd={handleOnDragEnd} sensors={sensors} collisionDetection={closestCenter}>
        <SortableContext items={statefulEntries} strategy={verticalListSortingStrategy}>
          <div className={style.list}>
            {order.map((eventId, index) => {
              // TODO: does iterating through order affect the sortable list?
              if (index === 0) {
                eventIndex = 0;
              }
              const event = rundown[eventId];
              let isFirstEvent = false;
              if (isOntimeEvent(event)) {
                isFirstEvent = eventIndex === 0;
                // event indexes are 1 based in frontend
                eventIndex++;
                if (!isFirstEvent) {
                  previousEnd = thisEnd;
                }
                thisEnd = event.timeEnd;
                previousEventId = event.id;
              }
              const isLast = index === order.length - 1;
              const isSelected = featureData?.selectedEventId === event.id;
              const isNext = featureData?.nextEventId === event.id;
              const hasCursor = event.id === cursor;
              if (isSelected) {
                isPast = false;
              }

              return (
                <Fragment key={event.id}>
                  <div className={style.entryWrapper} data-testid={`entry-${eventIndex}`}>
                    {isOntimeEvent(event) && <div className={style.entryIndex}>{eventIndex}</div>}
                    <div className={style.entry} key={event.id} ref={hasCursor ? cursorRef : undefined}>
                      <RundownEntry
                        type={event.type}
                        isPast={isPast}
                        eventIndex={eventIndex}
                        data={event}
                        selected={isSelected}
                        hasCursor={hasCursor}
                        next={isNext}
                        previousEnd={previousEnd}
                        previousEventId={previousEventId}
                        playback={isSelected ? featureData.playback : undefined}
                        isRolling={featureData.playback === Playback.Roll}
                      />
                    </div>
                  </div>
                  {((showQuickEntry && hasCursor) || isLast) && (
                    <QuickAddBlock
                      showKbd={hasCursor}
                      eventId={event.id}
                      previousEventId={previousEventId}
                      disableAddDelay={isOntimeDelay(event)}
                      disableAddBlock={isOntimeBlock(event)}
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
