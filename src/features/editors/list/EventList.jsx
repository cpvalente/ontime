import { useContext, useEffect } from 'react';
import { EventContext } from '../../../app/context/eventContext';
import { EventListContext } from '../../../app/context/eventListContext';
import EventListItem from './EventListItem';
import style from './List.module.css';
import DelayBlock from './DelayBlock';
import BlockBlock from './BlockBlock';
import EventListMenu from '../../menu/EventListMenu';


export default function EventList(props) {
  const [events, setEvents] = useContext(EventListContext);
  const [event] = useContext(EventContext);

  // update number of events
  useEffect(() => {
    const f = events.filter((e) => e.type === 'event');
    props.updatePlayback({ numEvents: f.length });
  }, [events]);

  const insertItemAt = (item, index) => {
    // handle insert at beggining of array
    if (index === -1) {
      // move all items one element down, starting from new position
      events.forEach((e) => {
        e.order = e.order + 1;
      });
      return [item, ...events];
    } else {
      let before = events.slice(0, index + 1);
      let after = events.slice(index + 1);

      // move all items one element down, starting from new position
      after.forEach((e) => {
        e.order = e.order + 1;
      });
      return [...before, item, ...after];
    }
  };

  const createEvent = (itemIndex = -1) => {
    // make an event
    // TODO: Replace this with global def somewhere
    // TODO: handle random ids better
    let newEvent = {
      id: Math.random(),
      order: itemIndex + 1,
      title: '',
      subtitle: '',
      presenter: '',
      timeStart: new Date(),
      timeEnd: new Date(),
      clockStarted: null,
      timerDuration: 0,
      type: 'event',
    };

    // set to state
    setEvents(insertItemAt(newEvent, itemIndex));
  };

  const createDelay = (itemIndex = 0) => {
    // make an event
    // TODO: Replace this with global def somewhere
    // TODO: handle random ids better
    let newEvent = {
      id: Math.random(),
      order: itemIndex + 1,
      timerDuration: 0,
      type: 'delay',
    };

    // set to state
    setEvents(insertItemAt(newEvent, itemIndex));
  };

  const createBlock = (itemIndex = 0) => {
    // make an event
    // TODO: Replace this with global def somewhere
    // TODO: handle random ids better
    let newEvent = {
      id: Math.random(),
      order: itemIndex + 1,
      type: 'block',
    };

    // set to state
    setEvents(insertItemAt(newEvent, itemIndex));
  };

  const deleteEvent = (index) => {
    // TODO: This feels weird?
    let e = events.splice(index, 1);
    setEvents([...events]);
  };

  const replaceAt = (array, index, value) => {
    const ret = array.slice(0);
    ret[index] = value;
    return ret;
  };

  const updateData = (itemIndex, data) => {
    const newEvents = replaceAt(events, itemIndex, data);
    setEvents(newEvents);
  };

  console.log('events in event list', events);
  let cumulativeDelay = 0;
  let eventCount = -1;

  return (
    <>
      <EventListMenu createEvent={createEvent} />
      <div className={style.eventContainer}>
        {events.map((e, index) => {
          if (e.type === 'event') {
            eventCount = eventCount + 1;
            return (
              <EventListItem
                key={e.id}
                index={index}
                data={e}
                selected={props.selected === eventCount}
                createEvent={createEvent}
                deleteEvent={deleteEvent}
                createDelay={createDelay}
                createBlock={createBlock}
                updateData={updateData}
                delay={cumulativeDelay}
              />
            );
          } else if (e.type === 'block') {
            cumulativeDelay = 0;
            return (
              <BlockBlock
                key={e.id}
                index={index}
                createEvent={createEvent}
                deleteEvent={deleteEvent}
              />
            );
          } else if (e.type === 'delay') {
            cumulativeDelay = cumulativeDelay + e.timerDuration;
            return (
              <DelayBlock
                key={e.id}
                index={index}
                data={e}
                createEvent={createEvent}
                deleteEvent={deleteEvent}
                updateData={updateData}
              />
            );
          }
        })}
      </div>
    </>
  );
}
