import { IconButton } from '@chakra-ui/button';
import { FiMinusCircle } from 'react-icons/fi';

export default function BlockIconBtn(props) {
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiMinusCircle />}
      colorScheme='purple'
      onClick={props.clickHandler}
      _focus={{ boxShadow: 'none' }}
    />
  );
}
