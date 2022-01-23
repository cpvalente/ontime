import { IconButton } from '@chakra-ui/button';
import { FiMinusCircle } from '@react-icons/all-files/fi/FiMinusCircle';

export default function BlockIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiMinusCircle />}
      colorScheme='purple'
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
