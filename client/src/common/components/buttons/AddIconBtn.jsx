import { IconButton } from '@chakra-ui/button';
import { FiPlus } from 'react-icons/fi';

export default function AddIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiPlus />}
      _expanded={{ bg: 'orange.300', color: 'white' }}
      _focus={{ boxShadow: 'none' }}
      backgroundColor={'orange.200'}
      color={'orange.500'}
      onClick={clickhandler}
      {...rest}
    />
  );
}
