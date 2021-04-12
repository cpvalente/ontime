import { IconButton } from '@chakra-ui/button';
import { FiSkipBack } from 'react-icons/fi';

export default function PrevIconBtn(props) {
  return (
    <IconButton
      icon={<FiSkipBack />}
      colorScheme= 'blackAlpha'
      variant= 'outline'
      onClick={props.clickHandler}
      width={90}
    />
  );
}
