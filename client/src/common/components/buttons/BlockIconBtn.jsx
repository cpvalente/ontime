import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { FiMinusCircle } from '@react-icons/all-files/fi/FiMinusCircle';

export default function BlockIconBtn(props) {
  const { clickhandler, size = 'xs', ...rest } = props;
  return (
    <IconButton
      size={size}
      icon={<FiMinusCircle />}
      colorScheme='purple'
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
