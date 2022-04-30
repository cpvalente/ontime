import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { IoPlaySkipForward } from '@react-icons/all-files/io5/IoPlaySkipForward';
import { Tooltip } from '@chakra-ui/tooltip';
import PropTypes from 'prop-types';

export default function NextIconBtn(props) {
  const { clickhandler, disabled, ...rest } = props;
  return (
    <Tooltip label='Next event' openDelay={500} shouldWrapChildren={disabled}>
      <IconButton
        icon={<IoPlaySkipForward size='22px' />}
        colorScheme='whiteAlpha'
        backgroundColor='#ffffff11'
        variant='outline'
        onClick={clickhandler}
        width={90}
        {...rest}
      />
    </Tooltip>
  );
}

NextIconBtn.propTypes = {
  clickhandler: PropTypes.func,
  disabled: PropTypes.bool,
};
