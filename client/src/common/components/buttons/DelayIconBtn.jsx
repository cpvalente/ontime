import { IconButton } from '@chakra-ui/button';
import { FiClock } from '@react-icons/all-files/fi/FiClock';

export default function DelayIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiClock />}
      colorScheme='yellow'
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
