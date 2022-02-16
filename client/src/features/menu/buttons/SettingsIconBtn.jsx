import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiSettings } from '@react-icons/all-files/fi/FiSettings';

export default function SettingsIconBtn(props) {
  const { clickhandler, size, ...rest } = props;
  return (
    <Tooltip label='Settings'>
      <IconButton
        size={size || 'xs'}
        icon={<FiSettings />}
        colorScheme='white'
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
