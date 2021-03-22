import { Table, Thead, Tbody, Tr, Th } from '@chakra-ui/react';
import { useState } from 'react';
import { sampleData } from '../../../app/sampleData';
import EventListItem from './EventListItem';

export default function EventList(props) {
  const [data, setData] = useState(sampleData);

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
        {data.events.map((e) => (
          <EventListItem
            key={e.id}
            data={e}
            isSelected={props.selected === e.id}
            setSelected={props.setSelected}
          />
        ))}
      </Tbody>
    </Table>
  );
}
