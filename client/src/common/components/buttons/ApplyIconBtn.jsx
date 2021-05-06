import { IconButton } from '@chakra-ui/button';
import { FiChevronsDown } from 'react-icons/fi';

export default function ApplyIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiChevronsDown />}
      colorScheme='orange'
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
