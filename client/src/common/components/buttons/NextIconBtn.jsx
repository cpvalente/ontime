import { IconButton } from '@chakra-ui/button';
import { FiSkipForward } from 'react-icons/fi';
import { Tooltip } from '@chakra-ui/tooltip';

export default function NextIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Next event' openDelay={500} shouldWrapChildren={props.disabled}>
      <IconButton
        icon={<FiSkipForward />}
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
