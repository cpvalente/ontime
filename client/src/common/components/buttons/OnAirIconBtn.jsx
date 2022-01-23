import { IconButton } from '@chakra-ui/button';
import { IoMicSharp } from '@react-icons/all-files/io5/IoMicSharp';
import { IoMicOffOutline } from '@react-icons/all-files/io5/IoMicOffOutline';
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
        onClick={() => actionHandler('update', { field: 'isPublic', value: !active })}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
