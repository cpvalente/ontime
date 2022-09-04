import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import PropTypes from 'prop-types';

export default function TooltipActionBtn(props) {
  const { clickHandler, icon, color, size='xs', tooltip, openDelay = 0, ...rest } = props;
  return (
    <Tooltip label={tooltip} openDelay={openDelay}>
      <IconButton
        aria-label={tooltip}
        size={size}
        icon={icon}
        onClick={clickHandler}
        {...rest}
      />
    </Tooltip>
  );
}

TooltipActionBtn.propTypes = {
  clickHandler: PropTypes.func,
  icon: PropTypes.element,
  color: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  tooltip: PropTypes.string,
  openDelay: PropTypes.number
}
