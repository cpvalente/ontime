import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { IoTimeOutline } from '@react-icons/all-files/io5/IoTimeOutline';
import { Tooltip } from '@chakra-ui/tooltip';

export default function RollIconBtn(props) {
  const { clickhandler, active, ...rest } = props;
  return (
    <Tooltip label='Roll mode' openDelay={500} shouldWrapChildren={props.disabled}>
      <IconButton
        icon={<IoTimeOutline size='24px' />}
        colorScheme='blue'
        variant={active ? 'solid' : 'outline'}
        onClick={clickhandler}
        width={120}
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
