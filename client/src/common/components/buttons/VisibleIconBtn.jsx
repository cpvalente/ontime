import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { IoSunny } from '@react-icons/all-files/io5/IoSunny';
import { Tooltip } from '@chakra-ui/tooltip';

export default function VisibleIconBtn(props) {
  const { actionHandler, active, ...rest } = props;
  return (
    <Tooltip label={active ? 'Make invisible' : 'Make visible'} openDelay={500}>
      <IconButton
        size={props.size || 'xs'}
        icon={<IoSunny size={'18px'}/>}
        colorScheme='blue'
        variant={active ? 'solid' : 'outline'}
        onClick={() =>
          actionHandler('update', { field: 'isPublic', value: !active })
        }
        _focus={{ boxShadow: 'none' }}
        {...rest}
      />
    </Tooltip>
  );
}
