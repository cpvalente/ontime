import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiPower } from 'react-icons/fi';

export default function QuitIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Quit Application'>
      <IconButton
        size={props.size || 'xs'}
        icon={<FiPower />}
        colorScheme='red'
        variant='outline'
        isRound
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
