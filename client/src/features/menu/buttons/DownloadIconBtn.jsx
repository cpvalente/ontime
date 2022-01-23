import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiDownload } from '@react-icons/all-files/fi/FiDownload';

export default function DownloadIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Export event list'>
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
