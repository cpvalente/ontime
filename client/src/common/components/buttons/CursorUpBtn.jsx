import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { IoCaretUp } from '@react-icons/all-files/io5/IoCaretUp';

export default function CursorUpBtn(props) {
  const { clickhandler, active, ref } = props;
  return (
    <Tooltip label='Move cursor up Alt + ↑'>
      <IconButton
        ref={ref}
        size={props.size || 'xs'}
        icon={<IoCaretUp />}
        color={active ? 'pink.100' : 'pink.300'}
        borderColor={active ? undefined : 'pink.300'}
        backgroundColor={active ? 'pink.400' : undefined}
        variant={active ? 'solid' : 'outline'}
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
      />
    </Tooltip>
  );
}
