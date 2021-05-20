import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiTarget } from 'react-icons/fi';

export default function LockIconBtn(props) {
  const { clickhandler, active, ref } = props;
  return (
    <Tooltip label='Lock cursor to current'>
      <IconButton
        ref={ref}
        size={props.size || 'xs'}
        icon={<FiTarget />}
        colorScheme='pink'
        color={'pink.300'}
        variant={active ? 'solid' : 'outline'}
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
      />
    </Tooltip>
  );
}
