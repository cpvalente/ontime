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
        color={active ? 'pink.100' : 'pink.300'}
        borderColor={active ? undefined : 'pink.300'}
        backgroundColor={active ? 'pink.300' : undefined}
        variant={active ? 'solid' : 'outline'}
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
      />
    </Tooltip>
  );
}
