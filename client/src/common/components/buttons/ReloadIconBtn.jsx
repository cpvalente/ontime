import { IconButton } from '@chakra-ui/button';
import { IoArrowUndo } from '@react-icons/all-files/io5/IoArrowUndo';
import { Tooltip } from '@chakra-ui/tooltip';

export default function ReloadIconButton(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Reload event' openDelay={500} shouldWrapChildren={props.disabled}>
      <IconButton
        icon={<IoArrowUndo size='22px' />}
        colorScheme='whiteAlpha'
        backgroundColor='#ffffff05'
        variant='outline'
        onClick={clickhandler}
        width={90}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
