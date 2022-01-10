import { IconButton } from '@chakra-ui/button';
import { IoStop } from 'react-icons/io5';
import { Tooltip } from '@chakra-ui/tooltip';

export default function UnloadIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Unload event' openDelay={500} shouldWrapChildren={props.disabled}>
      <IconButton
        icon={<IoStop size='22px' />}
        colorScheme='red'
        variant='outline'
        onClick={clickhandler}
        width={90}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
