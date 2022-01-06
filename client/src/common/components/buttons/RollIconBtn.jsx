import { IconButton } from '@chakra-ui/button';
import { FiClock } from 'react-icons/fi';
import { Tooltip } from '@chakra-ui/tooltip';

export default function RollIconBtn(props) {
  const { clickhandler, active, ...rest } = props;
  return (
    <Tooltip label='Roll mode' openDelay={500} shouldWrapChildren={props.disabled}>
      <IconButton
        icon={<FiClock />}
        colorScheme='blue'
        variant={active ? 'solid' : 'outline'}
        onClick={clickhandler}
        width={120}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
