import style from './List.module.css';

import { useEffect, useState } from 'react';
import { useSocket } from '../../../app/context/socketContext';
import tinykeys from 'tinykeys';
import Empty from '../../../common/state/Empty';
import EventListItem from './EventListItem';

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
      'Alt+KeyN': (event) => {
        event.preventDefault();
        if (cursor == null) return;
        if (events[cursor].type === 'event') setNext(cursor);
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

    // Handle playstate
    socket.on('selected-id', (data) => {
      setSelected(data);
    });

    // Clear listener
    return () => {
      socket.off('selected-id');
    };
  }, [socket]);

  if (events.length < 1) {
    return <Empty text='No Events' />;
  }

  console.log('EventList: events in event list', events);
  let cumulativeDelay = 0;

  return (
    <div className={style.eventContainer}>
      {cursor === -1 && <div className={style.cursor} />}

      {events.map((e, index) => {
        if (e.type === 'delay') cumulativeDelay += e.duration;
        else if (e.type === 'block') cumulativeDelay = 0;
        return (
          <div key={index}>
            <EventListItem
              type={e.type}
              index={index}
              data={e}
              selected={selected === e.id}
              next={next === index}
              eventsHandler={eventsHandler}
              delay={cumulativeDelay}
            />
            {cursor === index && <div className={style.cursor} />}
          </div>
        );
      })}
    </div>
  );
}
