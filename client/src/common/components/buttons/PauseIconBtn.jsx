import { IconButton } from '@chakra-ui/button';
import { IoPause } from '@react-icons/all-files/io5/IoPause';
import { Tooltip } from '@chakra-ui/tooltip';

export default function PauseIconBtn(props) {
  const { clickhandler, active, ...rest } = props;
  return (
    <Tooltip label='Pause timer' openDelay={500} shouldWrapChildren={props.disabled}>
      <IconButton
        icon={<IoPause size='24px' />}
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
