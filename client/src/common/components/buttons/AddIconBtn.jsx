import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { FiPlus } from '@react-icons/all-files/fi/FiPlus';

export default function AddIconBtn(props) {
  const { clickhandler, size = 'xs', ...rest } = props;
  return (
    <IconButton
      size={size}
      icon={<FiPlus />}
      _expanded={{ bg: 'orange.300', color: 'white' }}
      _focus={{ boxShadow: 'none' }}
      backgroundColor='orange.200'
      color='orange.500'
      onClick={clickhandler}
      {...rest}
    />
  );
}
