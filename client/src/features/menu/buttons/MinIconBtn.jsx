import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiMinimize } from '@react-icons/all-files/fi/FiMinimize';

export default function MinIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Close to tray'>
      <IconButton
        size={props.size || 'xs'}
        icon={<FiMinimize />}
        colorScheme='white'
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
