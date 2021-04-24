import { IconButton } from '@chakra-ui/button';
import { FiSettings } from 'react-icons/fi';

export default function SettingsIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiSettings />}
      isRound
      variant='outline'
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
