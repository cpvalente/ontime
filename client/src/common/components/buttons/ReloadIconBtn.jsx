import { IconButton } from '@chakra-ui/button';
import { FiRefreshCcw } from 'react-icons/fi';
import { Tooltip } from '@chakra-ui/tooltip';

export default function ReloadIconButton(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Reload Event' openDelay={500} shouldWrapChildren={props.disabled}>
      <IconButton
        icon={<FiRefreshCcw />}
        colorScheme='whiteAlpha'
        backgroundColor='#ffffff05'
        variant='outline'
        onClick={clickhandler}
        width={90}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
