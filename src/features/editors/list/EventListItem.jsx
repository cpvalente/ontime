import { IconButton } from '@chakra-ui/button';
import { Td, Tr } from '@chakra-ui/table';
import { format } from 'date-fns';
import { timeFormat } from '../../../common/dateConfig';
import { ChevronRightIcon } from '@chakra-ui/icons';

export default function EventListItem(props) {
  const selected = props.selected === props.data.id
  return (
    <Tr
      style={
        selected
          ? { backgroundColor: '#b2f5ea' }
          : { backgroundColor: 'white' }
      }
    >
      <Td>{props.data.title}</Td>
      <Td>{props.data.presenter}</Td>
      <Td>{format(props.data.timeStart, timeFormat)}</Td>
      <Td>{format(props.data.timeEnd, timeFormat)}</Td>
      <Td>
        <IconButton
          colorScheme='teal'
          variant={selected ? 'solid' : 'outline'}
          onClick={() => props.setSelectedEvent(props.data.id)}
          disabled={props.formMode !== null}
          size='sm'
          aria-label='Select Item'
          icon={<ChevronRightIcon />}
        />
      </Td>
    </Tr>
  );
}
