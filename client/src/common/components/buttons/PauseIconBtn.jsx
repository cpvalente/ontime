import { IconButton } from '@chakra-ui/button';
import { FiPause } from 'react-icons/fi';
import { Tooltip } from '@chakra-ui/tooltip';

export default function PauseIconBtn(props) {
  const { clickhandler, active, ...rest } = props;
  return (
    <Tooltip label='Pause timer' openDelay={500} shouldWrapChildren={props.disabled}>
      <IconButton
        icon={<FiPause />}
        colorScheme='orange'
        variant={active ? 'solid' : 'outline'}
        onClick={clickhandler}
        width={120}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
