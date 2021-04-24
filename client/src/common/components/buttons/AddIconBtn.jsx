import { IconButton } from '@chakra-ui/button';
import { FiPlus } from 'react-icons/fi';

export default function AddIconBtn(props) {
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiPlus />}
      colorScheme='blue'
      onClick={props.clickHandler}
      _focus={{ boxShadow: 'none' }}
      {...props}
    />
  );
}
