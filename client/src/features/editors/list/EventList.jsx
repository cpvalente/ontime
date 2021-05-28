import style from './List.module.css';
import { createRef, useEffect, useMemo, useState } from 'react';
import { useSocket } from 'app/context/socketContext';
import tinykeys from 'tinykeys';
import Empty from 'common/state/Empty';
import EventListItem from './EventListItem';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { useAtom } from 'jotai';
import { SelectSetting } from 'app/context/settingsAtom';

export default function EventList(props) {
  const { events, eventsHandler } = props;
  const socket = useSocket();
  const [selectedId, setSelectedId] = useState(null);
  const [nextId, setNextId] = useState(null);
  const [cursor, setCursor] = useState(0);
  const [cursorSettings] = useAtom(useMemo(() => SelectSetting('cursor'), []));

  const cursorRef = createRef();

  // Handle keyboard shortcuts
  useEffect(() => {
    let unsubscribe = tinykeys(window, {
      'Alt+ArrowDown': () => {
        if (cursor == null) setCursor(0);
        else if (cursor < events.length - 1) setCursor(cursor + 1);
      },
      'Alt+ArrowUp': () => {
        if (cursor == null) setCursor(0);
        else if (cursor > 0) setCursor(cursor - 1);
      },
      'Alt+KeyE': (event) => {
        event.preventDefault();
        if (cursor == null) return;
        eventsHandler('add', { type: 'event', order: cursor + 1 });
      },
      'Alt+KeyD': (event) => {
        event.preventDefault();
        if (cursor == null) return;
        eventsHandler('add', { type: 'delay', order: cursor + 1 });
      },
      'Alt+KeyB': (event) => {
        event.preventDefault();
        if (cursor == null) return;
        eventsHandler('add', { type: 'block', order: cursor + 1 });
      },
    });
    if (cursor > events.length - 1) setCursor(events.length - 1);
    return () => {
      unsubscribe();
    };
  }, [cursor, events, eventsHandler]);

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
    if (cursorSettings !== 'locked' || selectedId == null) return;

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
  }, [selectedId, cursorSettings]);

  if (events.length < 1) {
    return <Empty text='No Events' />;
  }

  // DND
  const handleOnDragEnd = (result) => {
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
  };

  console.log('EventList: events in event list', events);
  let cumulativeDelay = 0;
  let eventIndex = -1;

  return (
    <div className={style.eventContainer}>
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId='eventlist'>
          {(provided) => (
            <div
              className={style.list}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
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
                }

                return (
                  <div
                    ref={cursor === index ? cursorRef : undefined}
                    key={e.id}
                    className={cursor === index ? style.cursor : undefined}
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
