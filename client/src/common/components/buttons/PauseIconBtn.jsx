import { IconButton } from '@chakra-ui/button';
import { FiPause } from 'react-icons/fi';

export default function PauseIconBtn(props) {
  return (
    <IconButton
      icon={<FiPause />}
      colorScheme='orange'
      variant={props.active ? 'solid' : 'outline'}
      onClick={props.clickHandler}
      width={120}
      _focus={{ boxShadow: 'none' }}
      {...props}
    />
  );
}
