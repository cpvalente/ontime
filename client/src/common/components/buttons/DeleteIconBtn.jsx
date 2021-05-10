import { IconButton } from '@chakra-ui/button';
import { FiMinus } from 'react-icons/fi';

export default function DeleteIconBtn(props) {
  const { actionHandler, ...rest } = props;
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiMinus />}
      colorScheme='red'
      onClick={() => actionHandler('delete')}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
