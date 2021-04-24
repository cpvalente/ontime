import { IconButton } from '@chakra-ui/button';
import { FiMinus } from 'react-icons/fi';

export default function DeleteIconBtn(props) {
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiMinus />}
      colorScheme='red'
      onClick={props.clickHandler}
      _focus={{ boxShadow: 'none' }}
      {...props}
    />
  );
}
