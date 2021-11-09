import { IconButton } from '@chakra-ui/button';
import { FiXOctagon } from 'react-icons/fi';

export default function UnloadIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <IconButton
      icon={<FiXOctagon />}
      colorScheme='red'
      backgroundColor='#ff000022'
      variant='outline'
      onClick={clickhandler}
      width={90}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
