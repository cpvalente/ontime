import { IconButton } from '@chakra-ui/button';
import { FiSun } from 'react-icons/fi';

export default function VisibleIconBtn(props) {
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiSun />}
      colorScheme='blue'
      variant={props.active ? 'solid' : 'outline'}
      onClick={props.clickHandler}
      _focus={{ boxShadow: 'none' }}
    />
  );
}
