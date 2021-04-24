import { IconButton } from '@chakra-ui/button';
import { FiRefreshCcw } from 'react-icons/fi';

export default function ReloadIconButton(props) {
  return (
    <IconButton
      icon={<FiRefreshCcw />}
      colorScheme='whiteAlpha'
      backgroundColor='#ffffff05'
      variant='outline'
      onClick={props.clickHandler}
      width={90}
      _focus={{ boxShadow: 'none' }}
      {...props}
    />
  );
}
