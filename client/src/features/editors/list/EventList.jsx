import style from './List.module.css';
import DelayBlock from './DelayBlock';
import BlockBlock from './BlockBlock';
import EventBlock from './EventBlock';
import { useEffect, useState } from 'react';
import { useSocket } from '../../../app/context/socketContext';

export default function EventList(props) {
  const { events, eventsHandler } = props;
  const socket = useSocket();
  const [selected, setSelected] = useState(null);

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

  console.log('EventList: events in event list', events);
  let cumulativeDelay = 0;
  let eventCount = -1;

  // Torbjorn: is this very dirty code?
  //  -- map and cumulative delay thing
  // -- should i skip the order value and just use the array as order? (checkout dnd)
  return (
    <div className={style.eventContainer}>
      {events.map((e, index) => {
        if (e.type === 'event') {
          eventCount = eventCount + 1;
          return (
            <EventBlock
              key={e.id}
              index={index}
              data={e}
              selected={selected === e.id}
              eventsHandler={eventsHandler}
              delay={cumulativeDelay}
            />
          );
        } else if (e.type === 'block') {
          cumulativeDelay = 0;
          return (
            <BlockBlock
              key={e.id}
              index={index}
              data={e}
              eventsHandler={eventsHandler}
            />
          );
        } else if (e.type === 'delay') {
          cumulativeDelay = cumulativeDelay + e.duration;
          return (
            <DelayBlock
              key={e.id}
              index={index}
              data={e}
              eventsHandler={eventsHandler}
            />
          );
        }
      })}
    </div>
  );
}
