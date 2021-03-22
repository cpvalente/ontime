import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  Button,
} from '@chakra-ui/react';

export default function EventList() {
  return (
    <div className>
      <Table variant='simple' size='sm'>
        <TableCaption>Todays event list</TableCaption>

        <Thead>
          <Tr>
            <Th>Event Title</Th>
            <Th>Event Subtitle</Th>
            <Th>Presenter Name</Th>
            <Th>Time Start</Th>
            <Th>Time End</Th>
            <Th>Timer</Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Title</Td>
            <Td>Subtitle</Td>
            <Td>Presenter</Td>
            <Td>10:00</Td>
            <Td>11:00</Td>
            <Td>60.00</Td>
            <Td>
              <Button colorScheme='teal'>❯</Button>
            </Td>
          </Tr>
          <Tr>
            <Td>Title</Td>
            <Td>Subtitle</Td>
            <Td>Presenter</Td>
            <Td>10:00</Td>
            <Td>11:00</Td>
            <Td>60.00</Td>
            <Td>
              <Button colorScheme='teal'>❯</Button>
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </div>
  );
}
