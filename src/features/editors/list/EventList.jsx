import {
  AddIcon,
  AttachmentIcon,
  ChevronDownIcon,
  DownloadIcon,
} from '@chakra-ui/icons';
import {
  Button,
  ButtonGroup,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from '@chakra-ui/react';
import { useContext } from 'react';
import { EventContext } from '../../../app/context/eventContext';
import { EventListContext } from '../../../app/context/eventListContext';
import EventListItem from './EventListItem';
import style from './List.module.css';
import DelayBlock from './DelayBlock';
import BlockBlock from './BlockBlock';

export default function EventList() {
  const [events, setEvents] = useContext(EventListContext);
  const [event] = useContext(EventContext);

  const selected = event?.id || -1;

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
  return (
    <>
      <div className={style.headerButtons}>
        <Menu>
          <ButtonGroup isAttached>
            <Button size='sm' variant='outline'>
              Upload
            </Button>
            <MenuButton
              as={Button}
              leftIcon={<AttachmentIcon />}
              size='sm'
              variant='outline'
            >
              <ChevronDownIcon />
            </MenuButton>
          </ButtonGroup>
          <MenuList>
            <MenuItem>Upload Excel</MenuItem>
            <MenuItem>Upload CSV</MenuItem>
          </MenuList>
        </Menu>
        <Menu>
          <ButtonGroup isAttached>
            <Button size='sm' variant='outline'>
              Save
            </Button>
            <MenuButton
              as={Button}
              leftIcon={<DownloadIcon />}
              size='sm'
              variant='outline'
            >
              <ChevronDownIcon />
            </MenuButton>
          </ButtonGroup>
          <MenuList>
            <MenuItem>Download Excel</MenuItem>
            <MenuItem>Download CSV</MenuItem>
          </MenuList>
        </Menu>
        <IconButton
          size='sm'
          icon={<AddIcon />}
          colorScheme='blue'
          onClick={() => createEvent()}
        />
      </div>
      <div className={style.eventContainer}>
        {events.map((e, index) => {
          if (e.type === 'event') {
            return (
              <EventListItem
                key={e.id}
                index={index}
                data={e}
                selected={e.id === selected}
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
