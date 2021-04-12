import { IconButton } from '@chakra-ui/button';
import { FiClock } from 'react-icons/fi';

export default function RollIconBtn(props) {
  return (
    <IconButton
      icon={<FiClock />}
      colorScheme='blue'
      variant={props.active ? 'solid' : 'outline'}
      onClick={props.clickHandler}
      width={90}
    />
  );
}
