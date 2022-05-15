import React, { createRef, useCallback, useContext, useEffect, useState } from 'react';
import style from './List.module.scss';
import { useSocket } from 'app/context/socketContext';
import Empty from 'common/state/Empty';
import EventListItem from './EventListItem';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import EntryBlock from '../EntryBlock/EntryBlock';
import { CursorContext } from '../../../app/context/CursorContext';
import { LocalEventSettingsContext } from '../../../app/context/LocalEventSettingsContext';

export default function EventList(props) {
  const { events, eventsHandler } = props;
  const { cursor, moveCursorUp, moveCursorDown, setCursor, isCursorLocked } =
    useContext(CursorContext);
  const socket = useSocket();
  const [selectedId, setSelectedId] = useState(null);
  const [nextId, setNextId] = useState(null);
  const cursorRef = createRef();
  const { showQuickEntry } = useContext(LocalEventSettingsContext);

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
          eventsHandler('add', { type: 'event', order: cursor + 1 });
        }
        // D
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          if (cursor == null) return;
          eventsHandler('add', { type: 'delay', order: cursor + 1 });
        }
        // B
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          if (cursor == null) return;
          eventsHandler('add', { type: 'block', order: cursor + 1 });
        }
      }
    },
    [cursor, events.length, eventsHandler, moveCursorDown, moveCursorUp]
  );

  useEffect(() => {
    // attach the event listener
    document.addEventListener('keydown', handleKeyPress);

    if (cursor > events.length - 1) setCursor(events.length - 1);

    // remove the event listener
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress, cursor, events, setCursor]);

  // handle incoming messages
  useEffect(() => {
    if (socket == null) return;

    // ask for playstate
    socket.emit('get-selected');
    socket.emit('get-next-id');

    // Handle playstate
    socket.on('selected', (data) => {
      setSelectedId(data.id);
    });

    socket.on('next-id', (data) => {
      setNextId(data);
    });

    // Clear listener
    return () => {
      socket.off('selected');
      socket.off('next-id');
    };
  }, [socket]);

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
    if (!isCursorLocked || selectedId == null) return;

    // move cursor
    let gotoIndex = -1;
    let found = false;
    for (const e of events) {
      gotoIndex++;
      if (e.id === selectedId) {
        found = true;
        break;
      }
    }
    if (found) {
      // move cursor
      setCursor(gotoIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, isCursorLocked]);

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
                return (
                  <div key={e.id}>
                    {index === 0 && showQuickEntry && (
                      <EntryBlock index={-1} eventsHandler={eventsHandler} />
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
                        selected={selectedId === e.id}
                        next={nextId === e.id}
                        eventsHandler={eventsHandler}
                        delay={cumulativeDelay}
                        previousEnd={previousEnd}
                      />
                    </div>
                    <EntryBlock
                      showKbd={index === cursor}
                      index={index}
                      eventsHandler={eventsHandler}
                      visible={index === events.length - 1}
                    />
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
