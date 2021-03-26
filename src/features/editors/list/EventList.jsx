import { AddIcon, AttachmentIcon, DownloadIcon } from '@chakra-ui/icons';
import { Button, IconButton } from '@chakra-ui/react';
import { useContext } from 'react';
import { EventContext } from '../../../app/context/eventContext';
import { EventListContext } from '../../../app/context/eventListContext';
import EventListItem from './EventListItem';
import { sortByOrderVal } from './listUtils';
import style from './List.module.css';
import DelayBlock from './DelayBlock';
import BlockBlock from './BlockBlock';
import { createEvent } from '@testing-library/dom';

export default function EventList(props) {
  const [events, setEvents] = useContext(EventListContext);
  const [event, setEvent] = useContext(EventContext);
  console.log('in el', events);

  const selected = event?.id || -1;

  const createEvent = (startPosition = 0) => {
    // make an event
    // TODO: Replace this with global def somewhere
    // TODO: handle random ids better
    let newEvent = {
      id: Math.floor(Math.random()*10000000),
      order: startPosition + 1,
      title: '',
      subtitle: '',
      presenter: '',
      timerStart: '',
      timerEnd: '',
      clockStarted: null,
      timerDuration: 0,
    };

    // move all items one element down, starting from new position
    let newEvents = events.map((e) => {
      if (e.order > startPosition) e.order = e.order + 1;
      return e;
    });

    // add an event at the beggining
    newEvents = [newEvent, ...events];

    // set to state
    setEvents(newEvents);
  };

  const deleteEvent = (position) => {
    // ?? SHould i reorder after?

    // remove event from array
    let filtered = events.filter((e) => e.id !== position);

    // set to state
    setEvents(filtered);
  };

  return (
    <>
      <div className={style.headerButtons}>
        <Button size='sm' rightIcon={<AttachmentIcon />} disabled>
          Upload
        </Button>
        <Button size='sm' rightIcon={<DownloadIcon />} disabled>
          Download
        </Button>
        <IconButton
          size='sm'
          icon={<AddIcon />}
          colorScheme='blue'
          onClick={() => createEvent()}
        />
      </div>
      <div className={style.eventContainer}>
        {sortByOrderVal(events).map((e) => (
          <EventListItem
            key={e.id}
            data={e}
            selected={e.id === selected}
            createEvent={createEvent}
            deleteEvent={deleteEvent}
          />
        ))}
      </div>
    </>
  );
}
