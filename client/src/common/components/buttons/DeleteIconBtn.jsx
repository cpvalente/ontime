import { IconButton } from '@chakra-ui/button';
import { FiMinus } from 'react-icons/fi';

export default function DeleteIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiMinus />}
      colorScheme='red'
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
