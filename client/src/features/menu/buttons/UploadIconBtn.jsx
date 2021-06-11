import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiUpload } from 'react-icons/fi';

export default function UploadIconBtn(props) {
  const { clickhandler, ...rest } = props;
  return (
    <Tooltip label='Upload File'>
      <IconButton
        size={props.size || 'xs'}
        icon={<FiUpload />}
        colorScheme='white'
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
