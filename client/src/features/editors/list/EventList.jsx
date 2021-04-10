import EventListItem from './EventListItem';
import style from './List.module.css';
import DelayBlock from './DelayBlock';
import BlockBlock from './BlockBlock';

export default function EventList(props) {
  const { events, selected, eventsHandler } = props;

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
            <EventListItem
              key={e.id}
              index={index}
              data={e}
              selected={selected === eventCount}
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
          cumulativeDelay = cumulativeDelay + e.timerDuration;
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
