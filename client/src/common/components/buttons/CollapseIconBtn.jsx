import { IconButton } from '@chakra-ui/button';
import { FiArrowDownCircle } from 'react-icons/fi';

export default function CollapseIconBtn(props) {
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiArrowDownCircle />}
      colorScheme='orange'
      variant={props.active ? 'solid' : 'outline'}
      onClick={props.clickHandler}
      _focus={{ boxShadow: 'none' }}
      {...props}
    />
  );
}
