import { Table, Thead, Tbody, Tr, Th } from '@chakra-ui/react';
import { useContext } from 'react';
import { EventListContext } from '../../../app/context/eventListContext';
import EventListItem from './EventListItem';
import { sortByDate } from './listUtils';

export default function EventList(props) {
  const [events, setEvents] = useContext(EventListContext);

  console.log('e', events);
  console.log('sort', sortByDate(events));

  return (
    <Table variant='simple' size='sm'>
      <Thead>
        <Tr>
          <Th>Event Title</Th>
          <Th>Presenter Name</Th>
          <Th>Time Start</Th>
          <Th>Time End</Th>
          <Th></Th>
        </Tr>
      </Thead>
      <Tbody>
        {sortByDate(events).map((e) => (
          <EventListItem
            key={e.id}
            data={e}
            selected={props.selected}
            setSelectedEvent={props.setSelectedEvent}
            formMode={props.formMode}
          />
        ))}
      </Tbody>
    </Table>
  );
}
