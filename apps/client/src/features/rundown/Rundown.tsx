import { useCallback, useEffect, useRef } from 'react';
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { OntimeRundown, SupportedEvent } from 'ontime-types';

import { useEventAction } from '../../common/hooks/useEventAction';
import { useRundownEditor } from '../../common/hooks/useSocket';
import { useCursor } from '../../common/stores/cursorStore';
import { useLocalEvent } from '../../common/stores/localEvent';
import { cloneEvent } from '../../common/utils/eventsManager';

import QuickAddBlock from './quick-add-block/QuickAddBlock';
import RundownEmpty from './RundownEmpty';
import RundownEntry from './RundownEntry';

import style from './Rundown.module.scss';

interface RundownProps {
  entries: OntimeRundown;
}

export default function Rundown(props: RundownProps) {
  const { entries } = props;
  // TODO: should this go to the child element?
  const featureData = useRundownEditor();
  const { addEvent, reorderEvent } = useEventAction();
  const eventSettings = useLocalEvent((state) => state.eventSettings);
  const defaultPublic = eventSettings.defaultPublic;
  const startTimeIsLastEnd = eventSettings.startTimeIsLastEnd;
  const showQuickEntry = eventSettings.showQuickEntry;

  // cursor
  const cursor = useCursor((state) => state.cursor);
  const isCursorLocked = useCursor((state) => state.isCursorLocked);
  const moveCursorTo = useCursor((state) => state.moveCursorTo);
  const cursorRef = useRef<HTMLDivElement>();

  // DND KIT
  const sensors = useSensors(useSensor(PointerSensor));

  const insertAtCursor = useCallback(
    (type: SupportedEvent | 'clone', cursor: number) => {
      if (cursor === -1) {
        if (type === 'clone') {
          return;
        }
        addEvent({ type });
      } else {
        const previousEvent = entries?.[cursor];
        const nextEvent = entries?.[cursor + 1];

        // prevent adding two non-event blocks consecutively
        const isPreviousDifferent = previousEvent?.type !== type;
        const isNextDifferent = nextEvent?.type !== type;
        if (type === 'clone' && previousEvent?.type === SupportedEvent.Event) {
          const newEvent = cloneEvent(previousEvent);
          newEvent.after = previousEvent.id;
          addEvent(newEvent);
        } else if (type === SupportedEvent.Event) {
          const newEvent = {
            type: SupportedEvent.Event,
          };
          const options = {
            defaultPublic: defaultPublic,
            startTimeIsLastEnd: startTimeIsLastEnd,
            lastEventId: previousEvent.id,
            after: previousEvent.id,
          };
          addEvent(newEvent, options);
        } else if (isPreviousDifferent && isNextDifferent && type !== 'clone') {
          addEvent({ type }, { after: previousEvent.id });
        }
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
            if (cursor < entries.length - 1) moveCursorTo(cursor + 1);
            break;
          }
          case 'ArrowUp': {
            if (cursor > 0) moveCursorTo(cursor - 1);
            break;
          }
          case 'KeyE': {
            event.preventDefault();
            if (cursor === -1) return;
            insertAtCursor(SupportedEvent.Event, cursor);
            break;
          }
          case 'KeyD': {
            event.preventDefault();
            if (cursor < 0) return;
            insertAtCursor(SupportedEvent.Delay, cursor);
            break;
          }
          case 'KeyB': {
            event.preventDefault();
            if (cursor < 0) return;
            insertAtCursor(SupportedEvent.Block, cursor);
            break;
          }
          case 'KeyC': {
            event.preventDefault();
            if (cursor < 0) return;
            insertAtCursor('clone', cursor);
            break;
          }
        }
      }
    },
    [cursor, entries.length, insertAtCursor, moveCursorTo],
  );

  // move cursor
  // useEffect(() => {
  //   if (cursor > entries.length - 1) moveCursorTo(entries.length - 1);
  //   if (entries.length > 0 && cursor === -1) moveCursorTo(0);
  // }, [cursor, entries.length, moveCursorTo]);

  // listen to keys
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // when cursor moves, view should follow
  useEffect(() => {
    if (!cursorRef?.current) return;

    // using start in block parameter causes jumpy behaviour
    // could alternatively scroll using scrollTo and
    // calculate position within a range
    // if the item is near the top half, we are ok
    // otherwise scroll difference
    cursorRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    });
  }, [cursorRef]);

  // if selected event
  // or cursor settings changed
  useEffect(() => {
    // and if we are locked
    if (!isCursorLocked || !featureData?.selectedEventId) {
      return;
    }

    // move cursor
    let gotoIndex = -1;
    let found = false;
    for (const entry of entries) {
      gotoIndex++;
      if (entry.id === featureData.selectedEventId) {
        found = true;
        break;
      }
    }
    if (found) {
      moveCursorTo(gotoIndex);
    }
  }, [featureData?.selectedEventId, entries, isCursorLocked, moveCursorTo]);

  const handleOnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over?.id) {
      if (active.id !== over?.id) {
        const fromIndex = active.data.current?.sortable.index;
        const toIndex = over.data.current?.sortable.index;
        reorderEvent(String(active.id), fromIndex, toIndex);
      }
    }
  };

  if (!entries.length) {
    return <RundownEmpty handleAddNew={() => insertAtCursor(SupportedEvent.Event, -1)} />;
  }

  let cumulativeDelay = 0;
  let previousEnd = 0;
  let thisEnd = 0;
  let previousEventId: string | undefined;
  let eventIndex = -1;

  return (
    <div className={style.eventContainer}>
      <DndContext
        onDragEnd={handleOnDragEnd}
        sensors={sensors}
        modifiers={[restrictToVerticalAxis]}
        collisionDetection={closestCenter}
      >
        <SortableContext items={entries} strategy={verticalListSortingStrategy}>
          <div className={style.list}>
            {entries.map((entry, index) => {
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

              return (
                <div key={entry.id} ref={cursor === index ? cursorRef : undefined}>
                  <RundownEntry
                    type={entry.type}
                    index={index}
                    eventIndex={eventIndex}
                    data={entry}
                    selected={isSelected}
                    hasCursor={cursor === index}
                    next={isNext}
                    delay={cumulativeDelay}
                    previousEnd={previousEnd}
                    previousEventId={previousEventId}
                    playback={isSelected ? featureData.playback : undefined}
                  />

                  {((showQuickEntry && index === cursor) || isLast) && (
                    <QuickAddBlock
                      showKbd={false}
                      eventId={entry.id}
                      previousEventId={previousEventId}
                      disableAddDelay={entry.type === 'delay'}
                      disableAddBlock={entry.type === 'block'}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
