import style from './List.module.css';
import DelayBlock from './DelayBlock';
import BlockBlock from './BlockBlock';
import EventBlock from './EventBlock';
import { useEffect, useState } from 'react';
import { useSocket } from '../../../app/context/socketContext';
import tinykeys from 'tinykeys';
import Empty from '../../../common/state/Empty';

export default function EventList(props) {
  const { events, eventsHandler } = props;
  const socket = useSocket();
  const [selected, setSelected] = useState(null);
  const [next, setNext] = useState(null);
  const [cursor, setCursor] = useState(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    let unsubscribe = tinykeys(window, {
      'Shift+ArrowDown': () => {
        if (cursor == null) setCursor(0);
        else if (cursor < events.length - 1) setCursor(cursor + 1);
      },
      'Shift+ArrowUp': () => {
        if (cursor == null) setCursor(0);
        else if (cursor >= 0) setCursor(cursor - 1);
      },
      '$mod+Shift+ArrowUp': () => {
        setCursor(-1);
      },
      'Shift+KeyE': (event) => {
        event.preventDefault();
        if (cursor == null) return;
        eventsHandler('add', { type: 'event', order: cursor + 1 });
      },
      'Shift+KeyD': (event) => {
        event.preventDefault();
        if (cursor == null) return;
        eventsHandler('add', { type: 'delay', order: cursor + 1 });
      },
      'Shift+KeyB': (event) => {
        event.preventDefault();
        if (cursor == null) return;
        eventsHandler('add', { type: 'block', order: cursor + 1 });
      },
      'Shift+KeyN': (event) => {
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
  console.log('Debug: cursor', cursor);
  let cumulativeDelay = 0;
  let eventCount = -1;

  // Torbjorn: is this very dirty code?
  //  -- map and cumulative delay thing
  // -- should i skip the order value and just use the array as order? (checkout dnd)
  return (
    <div className={style.eventContainer}>
      {cursor === -1 && <div className={style.cursor} />}

      {events.map((e, index) => {
        if (e.type === 'event') {
          eventCount = eventCount + 1;
          return (
            <>
              <EventBlock
                key={e.id}
                index={index}
                data={e}
                selected={selected === e.id}
                next={next === index}
                eventsHandler={eventsHandler}
                delay={cumulativeDelay}
              />
              {index === cursor && <div className={style.cursor} />}
            </>
          );
        } else if (e.type === 'block') {
          cumulativeDelay = 0;
          return (
            <>
              <BlockBlock
                key={e.id}
                index={index}
                data={e}
                eventsHandler={eventsHandler}
              />
              {index === cursor && <div className={style.cursor} />}
            </>
          );
        } else if (e.type === 'delay') {
          cumulativeDelay = cumulativeDelay + e.duration;
          return (
            <>
              <DelayBlock
                key={e.id}
                index={index}
                data={e}
                eventsHandler={eventsHandler}
              />
              {index === cursor && <div className={style.cursor} />}
            </>
          );
        }
      })}
    </div>
  );
}
