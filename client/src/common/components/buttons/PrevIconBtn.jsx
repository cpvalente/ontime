import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { IoPlaySkipBack } from '@react-icons/all-files/io5/IoPlaySkipBack';
import { Tooltip } from '@chakra-ui/tooltip';

export default function PrevIconBtn(props) {
  const { clickhandler, disabled, ...rest } = props;
  return (
    <Tooltip label='Previous event' openDelay={500} shouldWrapChildren={disabled}>
      <IconButton
        icon={<IoPlaySkipBack size='22px' />}
        colorScheme='whiteAlpha'
        backgroundColor='#ffffff11'
        variant='outline'
        onClick={clickhandler}
        width={90}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
