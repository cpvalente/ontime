import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiMaximize } from '@react-icons/all-files/fi/FiMaximize';

export default function MaxIconBtn(props) {
  const { clickhandler, size, ...rest } = props;
  return (
    <Tooltip label='Show full window'>
      <IconButton
        size={size || 'xs'}
        icon={<FiMaximize />}
        colorScheme='white'
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
