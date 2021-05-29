import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiMinimize } from 'react-icons/fi';

export default function MinIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Close to tray'>
      <IconButton
        size={props.size || 'xs'}
        icon={<FiMinimize />}
        colorScheme='white'
        variant='outline'
        isRound
        borderColor='#fff1'
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
