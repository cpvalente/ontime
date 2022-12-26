import { createRef, Fragment, useCallback, useContext, useEffect } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { Button } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import {
  defaultPublicAtom,
  showQuickEntryAtom,
  startTimeIsLastEndAtom,
} from 'common/atoms/LocalEventSettings';
import Empty from 'common/components/state/Empty';
import { CursorContext } from 'common/context/CursorContext';
import { useEventAction } from 'common/hooks/useEventAction';
import { useRundownEditor } from 'common/hooks/useSocket';
import { OntimeRundown, SupportedEvent } from 'common/models/EventTypes';
import { cloneEvent } from 'common/utils/eventsManager';
import { useAtomValue } from 'jotai';
import PropTypes from 'prop-types';

import QuickAddBlock from './quick-add-block/QuickAddBlock';
import RundownEntry from './RundownEntry';

import style from './Rundown.module.scss';

interface RundownProps {
  entries: OntimeRundown;
}

export default function Rundown(props: RundownProps) {
  const { entries } = props;
  const { data } = useRundownEditor();
  const { cursor, moveCursorUp, moveCursorDown, moveCursorTo, isCursorLocked } =
    useContext(CursorContext);
  const startTimeIsLastEnd = useAtomValue(startTimeIsLastEndAtom);
  const defaultPublic = useAtomValue(defaultPublicAtom);
  const { addEvent, reorderEvent } = useEventAction();
  const cursorRef = createRef<HTMLDivElement>();
  const showQuickEntry = useAtomValue(showQuickEntryAtom);

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
            if (cursor < entries.length - 1) moveCursorDown();
            break;
          }
          case 'ArrowUp': {
            if (cursor > 0) moveCursorUp();
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
    [cursor, entries.length, insertAtCursor, moveCursorDown, moveCursorUp],
  );

  useEffect(() => {
    // attach the event listener
    document.addEventListener('keydown', handleKeyPress);

    if (cursor > entries.length - 1) moveCursorTo(entries.length - 1);
    if (entries.length > 0 && cursor === -1) moveCursorTo(0);

    // remove the event listener
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress, cursor, entries, moveCursorTo]);

  // when cursor moves, view should follow
  useEffect(() => {
    if (cursorRef.current == null) return;
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
    if (!isCursorLocked || !data?.selectedEventId) {
      return;
    }

    // move cursor
    let gotoIndex = -1;
    let found = false;
    for (const e of entries) {
      gotoIndex++;
      if (e.id === data.selectedEventId) {
        found = true;
        break;
      }
    }
    if (found) {
      // move cursor
      moveCursorTo(gotoIndex);
    }
  }, [data?.selectedEventId, entries, isCursorLocked, moveCursorTo]);

  // @ts-expect-error react-beautiful-dnd stuff, cant type
  const handleOnDragEnd = useCallback((result) => {
      // drop outside of area
      if (!result.destination) return;

      // no change
      if (result.destination === result.source.index) return;

      // Call API
      reorderEvent(result.draggableId, result.source.index, result.destination.index);
    },
    [reorderEvent],
  );

  if (!entries.length) {
    return (
      <div className={style.alignCenter}>
        <Empty text='No data yet' style={{ marginTop: '7vh' }} />
        <Button
          onClick={() => insertAtCursor(SupportedEvent.Event, -1)}
          variant='ontime-filled'
          className={style.spaceTop}
          leftIcon={<IoAdd />}
        >
          Create Event
        </Button>
      </div>
    );
  }
  let cumulativeDelay = 0;
  let eventIndex = -1;
  let previousEnd = 0;
  let thisEnd = 0;
  let previousEventId: string | undefined;

  return (
    <div className={style.eventContainer}>
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId='eventlist'>
          {(provided) => (
            <div className={style.list} {...provided.droppableProps} ref={provided.innerRef}>
              {entries.map((entry, index) => {
                if (index === 0) {
                  cumulativeDelay = 0;
                  eventIndex = -1;
                }
                if (entry.type === 'delay' && entry.duration != null) {
                  cumulativeDelay += entry.duration;
                } else if (entry.type === 'block') {
                  cumulativeDelay = 0;
                } else if (entry.type === 'event') {
                  eventIndex++;
                  previousEnd = thisEnd;
                  thisEnd = entry.timeEnd;
                  previousEventId = entry.id;
                }
                const isLast = index === entries.length - 1;
                const isSelected = data?.selectedEventId === entry.id;
                const isNext = data?.nextEventId === entry.id;

                return (
                  <Fragment key={entry.id}>
                    <div ref={cursor === index ? cursorRef : undefined}>
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
                        playback={isSelected ? data.playback || undefined : undefined}
                      />
                    </div>
                    {((showQuickEntry && index === cursor) || isLast) && (
                      <QuickAddBlock
                        showKbd={index === cursor}
                        eventId={entry.id}
                        previousEventId={previousEventId}
                        disableAddDelay={entry.type === 'delay'}
                        disableAddBlock={entry.type === 'block'}
                      />
                    )}
                  </Fragment>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

Rundown.propTypes = {
  entries: PropTypes.array,
};
