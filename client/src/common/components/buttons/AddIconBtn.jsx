import { IconButton } from '@chakra-ui/button';
import { FiPlus } from 'react-icons/fi';

export default function AddIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiPlus />}
      colorScheme='blue'
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
