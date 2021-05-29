import { IconButton } from '@chakra-ui/button';
import { FiClock } from 'react-icons/fi';

export default function RollIconBtn(props) {
  const { clickhandler, active, ...rest } = props;
  return (
    <IconButton
      icon={<FiClock />}
      colorScheme='blue'
      variant={active ? 'solid' : 'outline'}
      onClick={clickhandler}
      width={120}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
