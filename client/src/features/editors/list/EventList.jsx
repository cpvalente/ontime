import React, { createRef, useCallback, useContext, useEffect } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import Empty from 'common/components/state/Empty';
import { useAtomValue } from 'jotai';

import { showQuickEntryAtom } from '../../../common/atoms/LocalEventSettings';
import { CursorContext } from '../../../common/context/CursorContext';
import { useEventListProvider } from '../../../common/hooks/useSocketProvider';
import EntryBlock from '../EntryBlock/EntryBlock';

import EventListItem from './EventListItem';

import style from './List.module.scss';

export default function EventList(props) {
  const { events, eventsHandler } = props;
  const { cursor, moveCursorUp, moveCursorDown, setCursor, isCursorLocked } =
    useContext(CursorContext);
  const cursorRef = createRef();
  const showQuickEntry = useAtomValue(showQuickEntryAtom);
  const data = useEventListProvider();

  const insertAtCursor = useCallback(
    (type, cursor) => {
      if (cursor === -1) {
        eventsHandler('add', { type: type });
      } else {
        const previousEvent = events[cursor];
        const nextEvent = events[cursor + 1];
        if (type === 'event') {
          eventsHandler('add', { type: type, after: previousEvent.id });
        } else if (previousEvent?.type !== type && nextEvent?.type !== type) {
          eventsHandler('add', { type: type, after: previousEvent.id });
        }
      }
    },
    [events, eventsHandler]
  );

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback(
    (e) => {
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
    [cursor, events.length, insertAtCursor, moveCursorDown, moveCursorUp]
  );

  useEffect(() => {
    // attach the event listener
    document.addEventListener('keydown', handleKeyPress);

    if (cursor > events.length - 1) setCursor(events.length - 1);
    if (events.length > 0 && cursor === -1) setCursor(0);

    // remove the event listener
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress, cursor, events, setCursor]);

  // when cursor moves, view should follow
  useEffect(() => {
    if (cursorRef.current == null) return;
    cursorRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setCursor(gotoIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.selectedEventId, isCursorLocked]);

  // DND
  const handleOnDragEnd = useCallback(
    (result) => {
      // drop outside of area
      if (!result.destination) return;

      // no change
      if (result.destination === result.source.index) return;

      // Call API
      eventsHandler('reorder', {
        index: result.draggableId,
        from: result.source.index,
        to: result.destination.index,
      });
    },
    [eventsHandler]
  );

  if (events.length < 1) {
    return <Empty text='No Events' style={{ marginTop: '10vh' }} />;
  }
  let cumulativeDelay = 0;
  let eventIndex = -1;
  let previousEnd = 0;
  let thisEnd = 0;

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
                }
                const isLast = index === events.length - 1;
                return (
                  <div key={e.id}>
                    {index === 0 && showQuickEntry && (
                      <EntryBlock index={e.id} eventsHandler={eventsHandler} />
                    )}
                    <div
                      ref={cursor === index ? cursorRef : undefined}
                      className={cursor === index ? style.cursor : ''}
                    >
                      <EventListItem
                        type={e.type}
                        index={index}
                        eventIndex={eventIndex}
                        data={e}
                        selected={data.selectedEventId === e.id}
                        next={data.nextEventId === e.id}
                        eventsHandler={eventsHandler}
                        delay={cumulativeDelay}
                        previousEnd={previousEnd}
                      />
                    </div>
                    {(showQuickEntry || isLast) && (
                      <EntryBlock
                        showKbd={index === cursor}
                        previousId={e.id}
                        eventsHandler={eventsHandler}
                        visible={isLast}
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
