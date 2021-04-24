import { IconButton } from '@chakra-ui/button';
import { FiSun } from 'react-icons/fi';

export default function VisibleIconBtn(props) {
  const { clickhandler, active, ...rest } = props;
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiSun />}
      colorScheme='blue'
      variant={active ? 'solid' : 'outline'}
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
