import { createRef, useCallback, useContext, useEffect } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { Button } from '@chakra-ui/react';
import {
  defaultPublicAtom,
  showQuickEntryAtom,
  startTimeIsLastEndAtom,
} from 'common/atoms/LocalEventSettings';
import Empty from 'common/components/state/Empty';
import { CursorContext } from 'common/context/CursorContext';
import { useEventAction } from 'common/hooks/useEventAction';
import { duplicateEvent } from 'common/utils/eventsManager';
import { useAtomValue } from 'jotai';
import PropTypes from 'prop-types';

import { useRundownEditor } from '../../../common/hooks/useSocket';
import useSubscription from '../../../common/hooks/useSubscription';
import QuickAddBlock from '../quick-add-block/QuickAddBlock';

import EventListItem from './EventListItem';

import style from './List.module.scss';

export default function EventList(props) {
  const { events } = props;
  const { cursor, moveCursorUp, moveCursorDown, moveCursorTo, isCursorLocked } =
    useContext(CursorContext);
  const startTimeIsLastEnd = useAtomValue(startTimeIsLastEndAtom);
  const defaultPublic = useAtomValue(defaultPublicAtom);
  const { addEvent, reorderEvent } = useEventAction();
  const cursorRef = createRef();
  const showQuickEntry = useAtomValue(showQuickEntryAtom);
  // Todo: add selectedId and nextId to rundown editor hook
  const { data } = useRundownEditor();
  const [selectedId] = useSubscription('selected-id', null);
  const [nextId] = useSubscription('next-id', null);

  const insertAtCursor = useCallback(
    (type, cursor) => {
      if (cursor === -1) {
        addEvent({ type: type });
      } else {
        const previousEvent = events?.[cursor];
        const nextEvent = events?.[cursor + 1];

        // prevent adding two non-event blocks consecutively
        const isPreviousDifferent = previousEvent?.type !== type;
        const isNextDifferent = nextEvent?.type !== type;
        if (type === 'clone' && previousEvent) {
          const newEvent = duplicateEvent(previousEvent);
          newEvent.after = previousEvent.id;
          addEvent(newEvent);
        } else if (type === 'event') {
          const newEvent = {
            type: 'event',
            after: previousEvent.id,
            isPublic: defaultPublic,
          };
          const options = {
            startIsLastEnd: startTimeIsLastEnd ? previousEvent.id : undefined,
          };
          addEvent(newEvent, options);
        } else if (isPreviousDifferent && isNextDifferent) {
          addEvent({ type: type, after: previousEvent.id });
        }
      }
    },
    [addEvent, defaultPublic, events, startTimeIsLastEnd],
  );

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback(
    (e) => {
      // handle held key
      // handle held key
      if (e.repeat) return;
      // Check if the alt key is pressed
      if (e.altKey && (!e.ctrlKey || !e.shiftKey)) {
        // Arrow down
        if (e.keyCode === 40) {
          if (cursor < events.length - 1) moveCursorDown();
        }
        // Arrow up
        if (e.keyCode === 38) {
          if (cursor > 0) moveCursorUp();
        }
        // E
        if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          if (cursor == null) return;
          insertAtCursor('event', cursor);
        }
        // D
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          if (cursor == null) return;
          insertAtCursor('delay', cursor);
        }
        // B
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          if (cursor == null) return;
          insertAtCursor('block', cursor);
        }
      }
    },
    [cursor, events.length, insertAtCursor, moveCursorDown, moveCursorUp],
  );

  useEffect(() => {
    // attach the event listener
    document.addEventListener('keydown', handleKeyPress);

    if (cursor > events.length - 1) moveCursorTo(events.length - 1);
    if (events.length > 0 && cursor === -1) moveCursorTo(0);

    // remove the event listener
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress, cursor, events, moveCursorTo]);

  // when cursor moves, view should follow
  useEffect(() => {
    if (cursorRef.current == null) return;
    cursorRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    });
  }, [cursor]);

  // if selected event
  // or cursor settings changed
  useEffect(() => {
    // and if we are locked
    if (!isCursorLocked || data.selectedEventId == null) return;

    // move cursor
    let gotoIndex = -1;
    let found = false;
    for (const e of events) {
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
  }, [data.selectedEventId, isCursorLocked, moveCursorTo]);

  // DND
  const handleOnDragEnd = useCallback(
    (result) => {
      // drop outside of area
      if (!result.destination) return;

      // no change
      if (result.destination === result.source.index) return;

      // Call API
      reorderEvent(result.draggableId, result.source.index, result.destination.index);
    },
    [reorderEvent],
  );

  if (events.length < 1) {
    return (
      <div className={style.alignCenter}>
        <Empty text='No Events' style={{ marginTop: '7vh' }} />
        <Button
          onClick={() => insertAtCursor('event', cursor)}
          variant='solid'
          colorScheme='blue'
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
  let previousEventId = null;

  return (
    <div className={style.eventContainer}>
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId='eventlist'>
          {(provided) => (
            <div className={style.list} {...provided.droppableProps} ref={provided.innerRef}>
              {events.map((e, index) => {
                if (index === 0) {
                  cumulativeDelay = 0;
                  eventIndex = -1;
                }
                if (e.type === 'delay' && e.duration != null) {
                  cumulativeDelay += e.duration;
                } else if (e.type === 'block') {
                  cumulativeDelay = 0;
                } else if (e.type === 'event') {
                  eventIndex++;
                  previousEnd = thisEnd;
                  thisEnd = e.timeEnd;
                  previousEventId = e.id;
                }
                const isLast = index === events.length - 1;
                return (
                  <div
                    key={e.id}
                    className={`${style.bgElement}
                    ${e.type === 'event' && cumulativeDelay !== 0 ? style.delayed : ''}`}
                  >
                    <div
                      ref={cursor === index ? cursorRef : undefined}
                      className={cursor === index ? style.cursor : ''}
                    >
                      <EventListItem
                        type={e.type}
                        index={index}
                        eventIndex={eventIndex}
                        data={e}
                        selected={selectedId === e.id}
                        next={nextId === e.id}
                        delay={cumulativeDelay}
                        previousEnd={previousEnd}
                        playback={selectedId === e.id ? data.playback : undefined}
                      />
                    </div>
                    {((showQuickEntry && index === cursor) || isLast) && (
                      <QuickAddBlock
                        showKbd={index === cursor}
                        previousId={e.id}
                        previousEventId={previousEventId}
                        disableAddDelay={e.type === 'delay'}
                        disableAddBlock={e.type === 'block'}
                      />
                    )}
                  </div>
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

EventList.propTypes = {
  events: PropTypes.array,
};
