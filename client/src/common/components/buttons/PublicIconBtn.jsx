import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiUsers } from '@react-icons/all-files/fi/FiUsers';

export default function PublicIconBtn(props) {
  const { actionHandler, active, size, ...rest } = props;
  return (
    <Tooltip label={active ? 'Make event private' : 'Make event public'}>
      <IconButton
        size={size || 'xs'}
        icon={<FiUsers />}
        colorScheme='blue'
        variant={active ? 'solid' : 'outline'}
        onClick={() => actionHandler('update', { field: 'isPublic', value: !active })}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
