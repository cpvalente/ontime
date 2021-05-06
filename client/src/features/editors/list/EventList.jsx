import style from './List.module.css';
import { Fragment, useEffect, useState } from 'react';
import { useSocket } from '../../../app/context/socketContext';
import tinykeys from 'tinykeys';
import Empty from '../../../common/state/Empty';
import EventListItem from './EventListItem';
import { AnimatePresence, motion } from 'framer-motion';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

export default function EventList(props) {
  const { events, eventsHandler } = props;
  const socket = useSocket();
  const [selected, setSelected] = useState(null);
  const [next, setNext] = useState(null);
  const [cursor, setCursor] = useState(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    let unsubscribe = tinykeys(window, {
      'Alt+ArrowDown': () => {
        if (cursor == null) setCursor(0);
        else if (cursor < events.length - 1) setCursor(cursor + 1);
      },
      'Alt+ArrowUp': () => {
        if (cursor == null) setCursor(0);
        else if (cursor >= 0) setCursor(cursor - 1);
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
    socket.emit('get-selected-id');
    socket.emit('get-next-id');

    // Handle playstate
    socket.on('selected-id', (data) => {
      setSelected(data);
    });
    socket.on('next-id', (data) => {
      setNext(data);
    });

    // Clear listener
    return () => {
      socket.off('selected-id');
      socket.off('next-id');
    };
  }, [socket]);

  if (events.length < 1) {
    return <Empty text='No Events' />;
  }

  // motion
  const cursorVariants = {
    hidden: {
      scale: 0,
    },
    visible: {
      scale: 1,
      transition: {
        duration: 0.3,
      },
    },
    exit: {
      scale: 0,
    },
  };

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

  return (
    <div className={style.eventContainer}>
      <AnimatePresence>
        {cursor === -1 && (
          <motion.div
            className={style.cursor}
            variants={cursorVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
          />
        )}
      </AnimatePresence>
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId='eventlist'>
          {(provided) => (
            <div
              className={style.list}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {events.map((e, index) => {
                if (index === 0) cumulativeDelay = 0;
                if (e.type === 'delay' && e.duration != null) {
                  cumulativeDelay += e.duration;
                } else if (e.type === 'block') cumulativeDelay = 0;
                return (
                  <Fragment key={e.id}>
                    <EventListItem
                      type={e.type}
                      index={index}
                      data={e}
                      selected={selected === e.id}
                      next={next === e.id}
                      eventsHandler={eventsHandler}
                      delay={cumulativeDelay}
                    />
                    <AnimatePresence>
                      {cursor === index && (
                        <motion.div
                          className={style.cursor}
                          variants={cursorVariants}
                          initial='hidden'
                          animate='visible'
                          exit='exit'
                        />
                      )}
                    </AnimatePresence>
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
