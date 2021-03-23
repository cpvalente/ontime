import { Table, Thead, Tbody, Tr, Th } from '@chakra-ui/react';
import EventListItem from './EventListItem';

export default function EventList(props) {
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
        {props.data.events.map((e) => (
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
