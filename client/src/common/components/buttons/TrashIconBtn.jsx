import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { FiTrash2 } from '@react-icons/all-files/fi/FiTrash2';

export default function TrashIconBtn(props) {
  const { clickhandler, size = 'xs', ...rest } = props;
  return (
    <IconButton
      size={size}
      icon={<FiTrash2 />}
      colorScheme='red'
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
