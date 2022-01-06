import { IconButton } from '@chakra-ui/button';
import { FiPlay } from 'react-icons/fi';
import { Tooltip } from '@chakra-ui/tooltip';

export default function StartIconBtn(props) {
  const { clickhandler, active, ...rest } = props;
  return (
    <Tooltip label='Start timer' openDelay={500} shouldWrapChildren={props.disabled}>
      <IconButton
        icon={<FiPlay />}
        colorScheme='green'
        variant={active ? 'solid' : 'outline'}
        onClick={clickhandler}
        width={120}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
