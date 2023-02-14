import { IconButton, Tooltip } from '@chakra-ui/react';
import { IoTimeOutline } from '@react-icons/all-files/io5/IoTimeOutline';
import PropTypes from 'prop-types';

import { tooltipDelayMid } from '../../../ontimeConfig';

export default function RollIconBtn(props) {
  const { clickhandler, active, disabled, ...rest } = props;
  return (
    <Tooltip label='Roll mode' openDelay={tooltipDelayMid} shouldWrapChildren={disabled}>
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
  disabled: PropTypes.bool,
};
