import { Button } from '@chakra-ui/button';
import { FiChevronsDown } from 'react-icons/fi';

export default function ExpandBtn(props) {
  const { clickhandler } = props;
  return (
    <Button
      size={props.size || 'xs'}
      leftIcon={<FiChevronsDown />}
      colorScheme='whiteAlpha'
      variant='outline'
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
    >
      Expand All
    </Button>
  );
}
