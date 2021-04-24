import { IconButton } from '@chakra-ui/button';
import { FiPause } from 'react-icons/fi';

export default function PauseIconBtn(props) {
  const { clickhandler, active, ...rest } = props;
  return (
    <IconButton
      icon={<FiPause />}
      colorScheme='orange'
      variant={active ? 'solid' : 'outline'}
      onClick={clickhandler}
      width={120}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
