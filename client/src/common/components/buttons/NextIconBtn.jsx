import { IconButton } from '@chakra-ui/button';
import { FiSkipForward } from 'react-icons/fi';

export default function NextIconBtn(props) {
  return (
    <IconButton
      icon={<FiSkipForward />}
      colorScheme= 'whiteAlpha'
      backgroundColor='#ffffff05'
      variant= 'outline'
      onClick={props.clickHandler}
      width={90}
    />
  );
}
