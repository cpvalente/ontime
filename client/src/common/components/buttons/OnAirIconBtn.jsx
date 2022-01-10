import { IconButton } from '@chakra-ui/button';
import { IoMicSharp, IoMicOffOutline } from 'react-icons/io5';
import { Tooltip } from '@chakra-ui/tooltip';

export default function OnAirIconBtn(props) {
  const { actionHandler, active, ...rest } = props;
  return (
    <Tooltip label={active ? 'Go Off Air' : 'Go On Air'} openDelay={500}>
      <IconButton
        size={props.size || 'xs'}
        icon={active ? <IoMicSharp size='24px' /> : <IoMicOffOutline size='24px' />}
        colorScheme='blue'
        variant={active ? 'solid' : 'outline'}
        onClick={() =>
          actionHandler('update', { field: 'isPublic', value: !active })
        }
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
