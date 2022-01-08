import { FiX, FiCheck } from 'react-icons/fi';
import { Button } from '@chakra-ui/button';

export default function EnableBtn(props) {
  const { active, text, actionHandler } = props;
  return (
    <Button
      size={props.size || 'xs'}
      leftIcon={active ? <FiCheck /> : <FiX />}
      colorScheme='blue'
      variant={active ? 'solid' : 'outline'}
      onClick={actionHandler}
      _focus={{ boxShadow: 'none' }}
    >
      {text}
    </Button>
  );
}
