import { Table, Thead, Tbody, Tr, Th } from '@chakra-ui/react';
import { useContext } from 'react';
import { EventContext } from '../../../app/context/eventContext';
import { EventListContext } from '../../../app/context/eventListContext';
import EventListItem from './EventListItem';
import { sortByDate, sortByNumber } from './listUtils';

export default function EventList(props) {
  const [events] = useContext(EventListContext);
  const [event, setEvent] = useContext(EventContext);

  const handleSetSelected = (id) => {
    setEvent(events.filter((e) => e.id === id)[0]);
    props.setFormMode('edit');
  };

  const disabled = props.formMode !== null;

  return (
    <Table variant='simple' size='sm'>
      <Thead>
        <Tr>
          <Th>Event Title</Th>
          <Th>Event Subtitle</Th>
          <Th>Presenter Name</Th>
          <Th>Time Start</Th>
          <Th>Time End</Th>
          <Th></Th>
        </Tr>
      </Thead>
      <Tbody>
        {sortByNumber(events).map((e) => (
          <EventListItem
            key={e.id}
            data={e}
            disabled={disabled}
            selectedId={event?.id}
            setSelected={handleSetSelected}
          />
        ))}
      </Tbody>
    </Table>
  );
}
