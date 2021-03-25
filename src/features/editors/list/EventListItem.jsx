import { IconButton } from '@chakra-ui/button';
import { Td, Tr } from '@chakra-ui/table';
import { format } from 'date-fns';
import { timeFormat } from '../../../common/dateConfig';
import { LockIcon, ChevronRightIcon } from '@chakra-ui/icons';

export default function EventListItem(props) {
  const isSelected = props.selectedId === props.data.id;
  console.log(props);
  return (
    <Tr
      style={
        isSelected
          ? { backgroundColor: '#b2f5ea' }
          : { backgroundColor: 'white' }
      }
    >
      <Td>{props.data.title}</Td>
      <Td>{props.data.subtitle}</Td>
      <Td>{props.data.presenter}</Td>
      <Td>
        {props.data.timeStart && format(props.data.timeStart, timeFormat)}
      </Td>
      <Td>{props.data?.timeEnd && format(props.data?.timeEnd, timeFormat)}</Td>{' '}
      <Td>{props.data?.timerDuration}</Td>
      <Td>
        <IconButton
          colorScheme='teal'
          variant={isSelected ? 'solid' : 'outline'}
          onClick={() => props.setSelected(props.data.id)}
          disabled={props.disabled}
          size='sm'
          aria-label='Select Item'
          icon={<LockIcon />}
        />
      </Td>
      <Td>
        <IconButton
          colorScheme='teal'
          variant={isSelected ? 'solid' : 'outline'}
          onClick={() => props.setSelected(props.data.id)}
          disabled={props.disabled}
          size='sm'
          aria-label='Select Item'
          icon={<ChevronRightIcon />}
        />
      </Td>
    </Tr>
  );
}
