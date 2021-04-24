import { IconButton } from '@chakra-ui/button';
import { FiPlay } from 'react-icons/fi';

export default function StartIconBtn(props) {
  const { clickhandler, active, ...rest } = props;
  return (
    <IconButton
      icon={<FiPlay />}
      colorScheme='green'
      variant={active ? 'solid' : 'outline'}
      onClick={clickhandler}
      width={120}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
