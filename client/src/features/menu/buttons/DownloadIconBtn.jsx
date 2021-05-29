import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiDownload } from 'react-icons/fi';

export default function DownloadIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Download File'>
      <IconButton
        size={props.size || 'xs'}
        icon={<FiDownload />}
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
