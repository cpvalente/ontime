import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { IoTimeOutline } from '@react-icons/all-files/io5/IoTimeOutline';
import PropTypes from 'prop-types';

export default function RollIconBtn(props) {
  const { clickhandler, active, disabled, ...rest } = props;
  return (
    <Tooltip label='Roll mode' openDelay={500} shouldWrapChildren={disabled}>
      <IconButton
        icon={<IoTimeOutline size='24px' />}
        colorScheme='blue'
        variant={active ? 'solid' : 'outline'}
        onClick={clickhandler}
        width={120}
        disabled={disabled}
        {...rest}
      />
    </Tooltip>
  );
}

RollIconBtn.propTypes = {
  clickhandler: PropTypes.func,
  active: PropTypes.bool,
  disabled: PropTypes.bool
}
