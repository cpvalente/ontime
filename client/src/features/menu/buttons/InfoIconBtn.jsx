import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiHome } from 'react-icons/fi';

export default function InfoIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Event Main'>
      <IconButton
        size={props.size || 'xs'}
        icon={<FiHome />}
        colorScheme='white'
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
