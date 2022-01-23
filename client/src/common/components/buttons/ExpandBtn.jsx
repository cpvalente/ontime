import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiChevronsDown } from '@react-icons/all-files/fi/FiChevronsDown';

export default function ExpandBtn(props) {
  const { clickhandler } = props;
  return (
    <Tooltip label='Expand all'>
      <IconButton
        size={props.size || 'xs'}
        icon={<FiChevronsDown />}
        colorScheme='white'
        variant='outline'
        background='#fff1'
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
      />
    </Tooltip>
  );
}
