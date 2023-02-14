import { IconButton, Tooltip } from '@chakra-ui/react';
import { IoStop } from '@react-icons/all-files/io5/IoStop';
import PropTypes from 'prop-types';

import { tooltipDelayMid } from '../../../ontimeConfig';

export default function UnloadIconBtn(props) {
  const { clickHandler, disabled, ...rest } = props;
  return (
    <Tooltip label='Unload event' openDelay={tooltipDelayMid} shouldWrapChildren={disabled}>
      <IconButton
        icon={<IoStop size='22px' />}
        colorScheme='red'
        variant='outline'
        onClick={clickHandler}
        width={90}
        disabled={disabled}
        {...rest}
      />
    </Tooltip>
  );
}

UnloadIconBtn.propTypes = {
  clickHandler: PropTypes.func,
  disabled: PropTypes.bool,
};
