import { IconButton } from '@chakra-ui/button';
import { FiDownload } from 'react-icons/fi';

export default function DownloadIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiDownload />}
      isRound
      variant='outline'
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
      colorScheme='whiteAlpha'
      {...rest}
    />
  );
}
