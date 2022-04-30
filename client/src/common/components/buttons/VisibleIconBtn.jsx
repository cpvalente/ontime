import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { IoSunny } from '@react-icons/all-files/io5/IoSunny';
import { Tooltip } from '@chakra-ui/tooltip';
import PropTypes from 'prop-types';

export default function VisibleIconBtn(props) {
  const { actionHandler, active, size = 'xs', ...rest } = props;
  return (
    <Tooltip label={active ? 'Make invisible' : 'Make visible'} openDelay={500}>
      <IconButton
        size={size}
        icon={<IoSunny size='18px' />}
        colorScheme='blue'
        variant={active ? 'solid' : 'outline'}
        onClick={() => actionHandler('update', { field: 'isPublic', value: !active })}
        {...rest}
      />
    </Tooltip>
  );
}

VisibleIconBtn.propTypes = {
  actionHandler: PropTypes.func,
  active: PropTypes.bool,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
};
