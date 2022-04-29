import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { FiClock } from '@react-icons/all-files/fi/FiClock';

export default function DelayIconBtn(props) {
  const { clickhandler, size = 'xs', ...rest } = props;
  return (
    <IconButton
      size={size}
      icon={<FiClock />}
      colorScheme='yellow'
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
      {...rest}
    />
  );
}
