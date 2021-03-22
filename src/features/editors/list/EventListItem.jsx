import { Button } from '@chakra-ui/button';
import { Td, Tr } from '@chakra-ui/table';

export default function EventListItem(props) {
  return (
    <Tr
      style={
        props.isSelected
          ? { backgroundColor: '#b2f5ea' }
          : { backgroundColor: 'white' }
      }
    >
      <Td>{props.data.title}</Td>
      <Td>{props.data.presenter}</Td>
      <Td>{props.data.timeStart}</Td>
      <Td>{props.data.timeEnd}</Td>
      <Td>
        <Button
          colorScheme='teal'
          onClick={() => props.setSelected(props.data.id)}
        >
          ❯
        </Button>
      </Td>
    </Tr>
  );
}
