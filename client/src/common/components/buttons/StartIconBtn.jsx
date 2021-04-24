import { IconButton } from '@chakra-ui/button';
import { FiPlay } from 'react-icons/fi';

export default function StartIconBtn(props) {
  return (
    <IconButton
      icon={<FiPlay />}
      colorScheme='green'
      variant={props.active ? 'solid' : 'outline'}
      onClick={props.clickHandler}
      width={120}
      _focus={{ boxShadow: 'none' }}
      {...props}
    />
  );
}
