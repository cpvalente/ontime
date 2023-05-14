import { lazy, MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { OntimeRundown, Playback, SupportedEvent } from 'ontime-types';

import { useEventAction } from '../../common/hooks/useEventAction';
import { useRundownEditor } from '../../common/hooks/useSocket';
import { AppMode, useAppMode } from '../../common/stores/appModeStore';
import { useLocalEvent } from '../../common/stores/localEvent';
import { cloneEvent, getFirstEvent, getNextEvent, getPreviousEvent } from '../../common/utils/eventsManager';

import QuickAddBlock from './quick-add-block/QuickAddBlock';
import RundownEmpty from './RundownEmpty';

import style from './Rundown.module.scss';

const RundownEntry = lazy(() => import('./RundownEntry'));

interface RundownProps {
  entries: OntimeRundown;
}

export default function Rundown(props: RundownProps) {
  const { entries } = props;
  const [statefulEntries, setStatefulEntries] = useState(entries);

  const featureData = useRundownEditor();
  const { addEvent, reorderEvent } = useEventAction();
  const eventSettings = useLocalEvent((state) => state.eventSettings);
  const defaultPublic = eventSettings.defaultPublic;
  const startTimeIsLastEnd = eventSettings.startTimeIsLastEnd;
  const showQuickEntry = eventSettings.showQuickEntry;

  const isExtracted = window.location.pathname.includes('/rundown');

  // cursor
  const cursor = useAppMode((state) => state.cursor);
  const appMode = useAppMode((state) => state.mode);
  const viewFollowsCursor = appMode === AppMode.Run;
  const moveCursorTo = useAppMode((state) => state.setCursor);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

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
        const cursorEvent = entries.find((event) => event.id === cursor);
        if (cursorEvent?.type === SupportedEvent.Event) {
          const newEvent = cloneEvent(cursorEvent);
          newEvent.after = cursorEvent.id;
          addEvent(newEvent);
        }
      } else if (type === SupportedEvent.Event) {
        const newEvent = {
          type: SupportedEvent.Event,
        };
        const options = {
          defaultPublic: defaultPublic,
          startTimeIsLastEnd: startTimeIsLastEnd,
          lastEventId: cursor,
          after: cursor,
        };
        addEvent(newEvent, options);
      } else {
        addEvent({ type }, { after: cursor });
      }
    },
    [addEvent, defaultPublic, entries, startTimeIsLastEnd],
  );

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // handle held key
      if (event.repeat) return;
      // Check if the alt key is pressed
      if (event.altKey && (!event.ctrlKey || !event.shiftKey)) {
        switch (event.code) {
          case 'ArrowDown': {
            if (entries.length < 1) {
              return;
            }
            const nextEvent = cursor == null ? getFirstEvent(entries) : getNextEvent(entries, cursor);
            if (nextEvent) {
              moveCursorTo(nextEvent.id, nextEvent.type === SupportedEvent.Event);
            }
            break;
          }
          case 'ArrowUp': {
            if (entries.length < 1) {
              return;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we check for this before
            const previousEvent = cursor == null ? getFirstEvent(entries) : getPreviousEvent(entries, cursor);
            if (previousEvent) {
              moveCursorTo(previousEvent.id, previousEvent.type === SupportedEvent.Event);
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
      }
    },
    [cursor, entries, insertAtCursor, moveCursorTo],
  );

  // we copy the state from the store here
  // to workaround async updates on the drag mutations
  useEffect(() => {
    if (entries) {
      setStatefulEntries(entries);
    }
  }, [entries]);

  // listen to keys
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // when cursor moves, view should follow
  useEffect(() => {
    function scrollToComponent(
      componentRef: MutableRefObject<HTMLDivElement>,
      scrollRef: MutableRefObject<HTMLDivElement>,
    ) {
      const componentRect = componentRef.current.getBoundingClientRect();
      const scrollRect = scrollRef.current.getBoundingClientRect();
      const top = componentRect.top - scrollRect.top + scrollRef.current.scrollTop - 100;
      scrollRef.current.scrollTo({ top, behavior: 'smooth' });
    }

    if (cursorRef.current && scrollRef.current) {
      // Use requestAnimationFrame to ensure the component is fully loaded
      window.requestAnimationFrame(() => {
        scrollToComponent(cursorRef as MutableRefObject<HTMLDivElement>, scrollRef as MutableRefObject<HTMLDivElement>);
      });
    }

    // eslint-disable-next-line -- the prompt seems incorrect
  }, [cursorRef?.current, scrollRef]);

  useEffect(() => {
    // in run mode, we follow selection
    if (!viewFollowsCursor || !featureData?.selectedEventId) {
      return;
    }
    moveCursorTo(featureData.selectedEventId);
  }, [featureData?.selectedEventId, viewFollowsCursor, moveCursorTo]);

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

  let cumulativeDelay = 0;
  let previousEnd = 0;
  let thisEnd = 0;
  let previousEventId: string | undefined;
  let eventIndex = -1;
  let isPast = Boolean(featureData?.selectedEventId);

  return (
    <div className={style.eventContainer} ref={scrollRef}>
      <DndContext onDragEnd={handleOnDragEnd} sensors={sensors} collisionDetection={closestCenter}>
        <SortableContext items={statefulEntries} strategy={verticalListSortingStrategy}>
          <div className={style.list}>
            {statefulEntries.map((entry, index) => {
              if (index === 0) {
                cumulativeDelay = 0;
                eventIndex = -1;
              }
              if (entry.type === SupportedEvent.Delay && entry.duration !== null) {
                cumulativeDelay += entry.duration;
              } else if (entry.type === SupportedEvent.Block) {
                cumulativeDelay = 0;
              } else if (entry.type === SupportedEvent.Event) {
                eventIndex++;
                previousEnd = thisEnd;
                thisEnd = entry.timeEnd;
                previousEventId = entry.id;
              }
              const isLast = index === entries.length - 1;
              const isSelected = featureData?.selectedEventId === entry.id;
              const isNext = featureData?.nextEventId === entry.id;
              const hasCursor = entry.id === cursor;
              if (isSelected) {
                isPast = false;
              }

              return (
                <div key={entry.id} ref={hasCursor ? cursorRef : undefined}>
                  <RundownEntry
                    type={entry.type}
                    eventIndex={eventIndex}
                    isPast={isPast}
                    data={entry}
                    selected={isSelected}
                    hasCursor={hasCursor}
                    next={isNext}
                    delay={cumulativeDelay}
                    previousEnd={previousEnd}
                    previousEventId={previousEventId}
                    playback={isSelected ? featureData.playback : undefined}
                    isRolling={featureData.playback === Playback.Roll}
                    disableEdit={isExtracted}
                  />
                  {((showQuickEntry && hasCursor) || isLast) && (
                    <QuickAddBlock
                      showKbd={hasCursor}
                      eventId={entry.id}
                      previousEventId={previousEventId}
                      disableAddDelay={entry.type === SupportedEvent.Delay}
                      disableAddBlock={entry.type === SupportedEvent.Block}
                    />
                  )}
                </div>
              );
            })}
            <div className={style.spacer} />
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
