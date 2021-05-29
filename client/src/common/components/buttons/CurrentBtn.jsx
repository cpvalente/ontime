import { Button } from '@chakra-ui/button';
import { FiTarget } from 'react-icons/fi';

export default function CurrentBtn(props) {
  const { clickhandler, active } = props;
  return (
    <Button
      size={props.size || 'xs'}
      leftIcon={<FiTarget />}
      colorScheme='whiteAlpha'
      variant={active ? 'solid' : 'outline'}
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
    >
      Goto Current
    </Button>
  );
}
