import { IconButton } from '@chakra-ui/button';
import { FiArrowDownCircle } from 'react-icons/fi';

export default function CollapseIconBtn(props) {
  const { clickhandler, active, ...rest } = props;
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiArrowDownCircle />}
      colorScheme='orange'
      variant={active ? 'solid' : 'outline'}
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
