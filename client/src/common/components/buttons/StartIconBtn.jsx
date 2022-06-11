import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import PropTypes from 'prop-types';

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
        disabled={disabled}
        {...rest}
      />
    </Tooltip>
  );
}

StartIconBtn.propTypes = {
  clickhandler: PropTypes.func,
  active: PropTypes.bool,
  disabled: PropTypes.bool
}
