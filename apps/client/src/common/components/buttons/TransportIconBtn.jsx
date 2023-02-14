import { IconButton, Tooltip } from '@chakra-ui/react';
import PropTypes from 'prop-types';

import { tooltipDelayMid } from '../../../ontimeConfig';

export default function TransportIconBtn(props) {
  const { clickHandler, icon, tooltip, disabled, ...rest } = props;
  return (
    <Tooltip label={tooltip} openDelay={tooltipDelayMid} shouldWrapChildren={disabled}>
      <IconButton
        icon={icon}
        colorScheme='white'
        variant='outline'
        _hover={!disabled && { bg: '#ebedf0', color: '#333' }}
        onClick={clickHandler}
        width={90}
        disabled={disabled}
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
