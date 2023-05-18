import { IconButton, Tooltip } from '@chakra-ui/react';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import PropTypes from 'prop-types';

import { tooltipDelayMid } from '../../../ontimeConfig';

export default function StartIconBtn(props) {
  const { clickhandler, active, disabled, ...rest } = props;
  return (
    <Tooltip label='Start timer' openDelay={tooltipDelayMid} shouldWrapChildren={disabled}>
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
