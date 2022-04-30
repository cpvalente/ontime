import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import PropTypes from 'prop-types';

export default function TransportIconBtn(props) {
  const { clickHandler, icon, tooltip, disabled, ...rest } = props;
  return (
    <Tooltip label={tooltip} openDelay={500} shouldWrapChildren={disabled}>
      <IconButton
        icon={icon}
        colorScheme='white'
        variant='outline'
        _hover={{ bg: '#ebedf0', color: '#333' }}
        onClick={clickHandler}
        width={90}
        {...rest}
      />
    </Tooltip>
  );
}

TransportIconBtn.propTypes = {
  clickHandler: PropTypes.func,
  icon: PropTypes.element,
  tooltip: PropTypes.string,
  disabled: PropTypes.bool,
};
