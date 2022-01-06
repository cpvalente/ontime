import { IconButton } from '@chakra-ui/button';
import { FiSkipBack } from 'react-icons/fi';
import { Tooltip } from '@chakra-ui/tooltip';

export default function PrevIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Previous event' openDelay={500} shouldWrapChildren={props.disabled}>
      <IconButton
        icon={<FiSkipBack />}
        colorScheme='whiteAlpha'
        backgroundColor='#ffffff11'
        variant='outline'
        onClick={clickhandler}
        width={90}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
