import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiSettings } from 'react-icons/fi';

export default function SettingsIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Application Settings'>
      <IconButton
        size={props.size || 'xs'}
        icon={<FiSettings />}
        colorScheme='white'
        variant='outline'
        isRound
        borderColor='#fff1'
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
