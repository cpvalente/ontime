import { IconButton } from '@chakra-ui/button';
import { IoPlaySkipForward } from 'react-icons/io5';
import { Tooltip } from '@chakra-ui/tooltip';

export default function NextIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Next event' openDelay={500} shouldWrapChildren={props.disabled}>
      <IconButton
        icon={<IoPlaySkipForward size='22px' />}
        colorScheme='whiteAlpha'
        backgroundColor='#ffffff11'
        variant='outline'
        onClick={clickhandler}
        width={90}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
