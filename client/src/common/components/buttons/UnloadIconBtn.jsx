import { IconButton } from '@chakra-ui/button';
import { FiSquare } from 'react-icons/fi';
import { Tooltip } from '@chakra-ui/tooltip';

export default function UnloadIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Unload event' openDelay={500} shouldWrapChildren={props.disabled}>
      <IconButton
        icon={<FiSquare />}
        colorScheme='red'
        backgroundColor='#ff000022'
        variant='outline'
        onClick={clickhandler}
        width={90}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
