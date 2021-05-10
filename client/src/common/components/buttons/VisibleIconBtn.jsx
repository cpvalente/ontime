import { IconButton } from '@chakra-ui/button';
import { FiSun } from 'react-icons/fi';

export default function VisibleIconBtn(props) {
  const { actionHandler, active, ...rest } = props;
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiSun />}
      colorScheme='blue'
      variant={active ? 'solid' : 'outline'}
      onClick={() =>
        actionHandler('update', { field: 'isPublic', value: !active })
      }
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
