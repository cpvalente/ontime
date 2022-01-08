import { IconButton } from '@chakra-ui/button';
import { FiMic, FiMicOff } from 'react-icons/fi';
import { Tooltip } from '@chakra-ui/tooltip';

export default function OnAirIconBtn(props) {
  const { actionHandler, active, ...rest } = props;
  return (
    <Tooltip label={active ? 'Go Off Air' : 'Go On Air'} openDelay={500}>
      <IconButton
        size={props.size || 'xs'}
        icon={active ? <FiMic /> : <FiMicOff />}
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
