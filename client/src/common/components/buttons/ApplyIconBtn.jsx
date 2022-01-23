import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';

export default function ApplyIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Apply delays'>
      <IconButton
        size={props.size || 'xs'}
        icon={<FiCheck />}
        colorScheme='orange'
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
