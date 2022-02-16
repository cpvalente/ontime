import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { Tooltip } from '@chakra-ui/tooltip';

export default function StartIconBtn(props) {
  const { clickhandler, active, disabled, ...rest } = props;
  return (
    <Tooltip label='Start timer' openDelay={500} shouldWrapChildren={disabled}>
      <IconButton
        icon={<IoPlay size='24px' />}
        colorScheme='green'
        variant={active ? 'solid' : 'outline'}
        onClick={clickhandler}
        width={120}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
