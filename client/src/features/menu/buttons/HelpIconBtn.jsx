import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiHelpCircle } from '@react-icons/all-files/fi/FiHelpCircle';

export default function HelpIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Help'>
      <IconButton
        size={props.size || 'xs'}
        icon={<FiHelpCircle />}
        colorScheme='white'
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
