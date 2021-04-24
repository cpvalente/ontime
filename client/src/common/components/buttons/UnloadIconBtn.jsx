import { IconButton } from '@chakra-ui/button';
import { FiCornerLeftUp } from 'react-icons/fi';

export default function UnloadIconBtn(props) {
  return (
    <IconButton
      icon={<FiCornerLeftUp />}
      colorScheme='whiteAlpha'
      backgroundColor='#ffffff05'
      variant='outline'
      onClick={props.clickHandler}
      width={90}
      _focus={{ boxShadow: 'none' }}
    />
  );
}
