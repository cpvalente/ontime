import { Button } from '@chakra-ui/button';
import { FiChevronsUp } from 'react-icons/fi';

export default function CollapseBtn(props) {
  const { clickhandler } = props;
  return (
    <Button
      size={props.size || 'xs'}
      leftIcon={<FiChevronsUp />}
      colorScheme='whiteAlpha'
      variant='outline'
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
    >
      Collapse All
    </Button>
  );
}
