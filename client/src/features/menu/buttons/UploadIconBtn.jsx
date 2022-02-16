import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiUpload } from '@react-icons/all-files/fi/FiUpload';

export default function UploadIconBtn(props) {
  const { clickhandler, size, ...rest } = props;
  return (
    <Tooltip label='Import event list'>
      <IconButton
        size={size || 'xs'}
        icon={<FiUpload />}
        colorScheme='white'
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
