import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiChevronsDown } from 'react-icons/fi';

export default function ApplyIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Apply delays'>
      <IconButton
        size={props.size || 'xs'}
        icon={<FiChevronsDown />}
        colorScheme='orange'
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
