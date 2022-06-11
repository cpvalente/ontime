import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { IoStop } from '@react-icons/all-files/io5/IoStop';
import PropTypes from 'prop-types';

export default function UnloadIconBtn(props) {
  const { clickHandler, disabled, ...rest } = props;
  return (
    <Tooltip label='Unload event' openDelay={500} shouldWrapChildren={disabled}>
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
