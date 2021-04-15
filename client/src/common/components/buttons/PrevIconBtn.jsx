import { IconButton } from '@chakra-ui/button';
import { FiSkipBack } from 'react-icons/fi';

export default function PrevIconBtn(props) {
  return (
    <IconButton
      icon={<FiSkipBack />}
      colorScheme= 'whiteAlpha'
      backgroundColor='#ffffff05'
      variant= 'outline'
      onClick={props.clickHandler}
      width={90}
    />
  );
}
