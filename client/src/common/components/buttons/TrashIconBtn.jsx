import { IconButton } from '@chakra-ui/button';
import { FiTrash2 } from '@react-icons/all-files/fi/FiTrash2';

export default function TrashIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiTrash2 />}
      colorScheme='red'
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
