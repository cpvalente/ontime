import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiMaximize } from 'react-icons/fi';

export default function MaxIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Show full window'>
      <IconButton
        size={props.size || 'xs'}
        icon={<FiMaximize />}
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
