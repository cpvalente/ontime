import { IconButton } from '@chakra-ui/button';
import { FiClock } from 'react-icons/fi';

export default function DelayIconBtn(props) {
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiClock />}
      colorScheme='yellow'
      onClick={props.clickHandler}
    />
  );
}
