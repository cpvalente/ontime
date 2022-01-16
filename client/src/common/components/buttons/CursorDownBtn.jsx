import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { IoCaretDown } from 'react-icons/io5';

export default function CursorDownBtn(props) {
  const { clickhandler, active, ref } = props;
  return (
    <Tooltip label='Move cursor down Alt + ↓'>
      <IconButton
        ref={ref}
        size={props.size || 'xs'}
        icon={<IoCaretDown />}
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
