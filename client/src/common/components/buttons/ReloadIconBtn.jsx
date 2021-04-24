import { IconButton } from '@chakra-ui/button';
import { FiRefreshCcw } from 'react-icons/fi';

export default function ReloadIconButton(props) {
  const { clickhandler, ...rest } = props;
  return (
    <IconButton
      icon={<FiRefreshCcw />}
      colorScheme='whiteAlpha'
      backgroundColor='#ffffff05'
      variant='outline'
      onClick={clickhandler}
      width={90}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
