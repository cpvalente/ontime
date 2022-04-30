import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { IoMicSharp } from '@react-icons/all-files/io5/IoMicSharp';
import { IoMicOffOutline } from '@react-icons/all-files/io5/IoMicOffOutline';
import { Tooltip } from '@chakra-ui/tooltip';
import PropTypes from 'prop-types';

export default function OnAirIconBtn(props) {
  const { actionHandler, active, size = 'xs', ...rest } = props;
  return (
    <Tooltip label={active ? 'Go Off Air' : 'Go On Air'} openDelay={500}>
      <IconButton
        size={size}
        icon={active ? <IoMicSharp size='24px' /> : <IoMicOffOutline size='24px' />}
        colorScheme='blue'
        variant={active ? 'solid' : 'outline'}
        onClick={() => actionHandler('update', { field: 'isPublic', value: !active })}
        {...rest}
      />
    </Tooltip>
  );
}

OnAirIconBtn.propTypes = {
  actionHandler: PropTypes.func,
  active: PropTypes.func,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
};
