import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiDownload } from 'react-icons/fi';

export default function DownloadIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Export Event List'>
      <IconButton
        size={props.size || 'xs'}
        icon={<FiDownload />}
        colorScheme='white'
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
