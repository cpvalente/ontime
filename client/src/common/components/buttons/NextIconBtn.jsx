import { IconButton } from '@chakra-ui/button';
import { FiSkipForward } from 'react-icons/fi';

export default function NextIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <IconButton
      icon={<FiSkipForward />}
      colorScheme='whiteAlpha'
      backgroundColor='#ffffff11'
      variant='outline'
      onClick={clickhandler}
      width={90}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
