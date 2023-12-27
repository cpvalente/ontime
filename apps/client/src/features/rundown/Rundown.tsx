import { Fragment, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { OntimeRundown, Playback, SupportedEvent } from 'ontime-types';
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
  entries: OntimeRundown;
}

export default function Rundown(props: RundownProps) {
  const { entries } = props;
  const [statefulEntries, setStatefulEntries] = useState(entries);

  const featureData = useRundownEditor();
  const { addEvent, reorderEvent } = useEventAction();
  const eventSettings = useEditorSettings((state) => state.eventSettings);
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
  useFollowComponent({ followRef: cursorRef, scrollRef: scrollRef, doFollow: true });

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
          const newEvent = cloneEvent(cursorEvent, cursorEvent.id);
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
            const nextEvent = cursor == null ? getFirst(entries) : getNext(entries, cursor);
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
            const previousEvent = cursor == null ? getFirst(entries) : getPrevious(entries, cursor);
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

  let previousEnd = 0;
  let thisEnd = 0;
  let previousEventId: string | undefined;
  let eventIndex = 0;
  let isPast = Boolean(featureData?.selectedEventId);

  return (
    <div className={style.eventContainer} ref={scrollRef}>
      <DndContext onDragEnd={handleOnDragEnd} sensors={sensors} collisionDetection={closestCenter}>
        <SortableContext items={statefulEntries} strategy={verticalListSortingStrategy}>
          <div className={style.list}>
            {statefulEntries.map((entry, index) => {
              if (index === 0) {
                eventIndex = 0;
              }
              let isFirstEvent = false;
              if (entry.type === SupportedEvent.Event) {
                isFirstEvent = eventIndex === 0;
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
                <Fragment key={entry.id}>
                  <div className={style.entryWrapper} data-testid={`entry-${eventIndex}`}>
                    {entry.type === SupportedEvent.Event && <div className={style.entryIndex}>{eventIndex}</div>}
                    <div className={style.entry} key={entry.id} ref={hasCursor ? cursorRef : undefined}>
                      <RundownEntry
                        type={entry.type}
                        isPast={isPast}
                        isFirstEvent={isFirstEvent}
                        data={entry}
                        selected={isSelected}
                        hasCursor={hasCursor}
                        next={isNext}
                        previousEnd={previousEnd}
                        previousEventId={previousEventId}
                        playback={isSelected ? featureData.playback : undefined}
                        isRolling={featureData.playback === Playback.Roll}
                        disableEdit={isExtracted}
                      />
                    </div>
                  </div>
                  {((showQuickEntry && hasCursor) || isLast) && (
                    <QuickAddBlock
                      showKbd={hasCursor}
                      eventId={entry.id}
                      previousEventId={previousEventId}
                      disableAddDelay={entry.type === SupportedEvent.Delay}
                      disableAddBlock={entry.type === SupportedEvent.Block}
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
