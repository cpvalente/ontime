import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { IoStop } from '@react-icons/all-files/io5/IoStop';
import { Tooltip } from '@chakra-ui/tooltip';
import PropTypes from 'prop-types';

export default function UnloadIconBtn(props) {
  const { clickhandler, disabled, ...rest } = props;
  return (
    <Tooltip label='Unload event' openDelay={500} shouldWrapChildren={disabled}>
      <IconButton
        icon={<IoStop size='22px' />}
        colorScheme='red'
        variant='outline'
        onClick={clickhandler}
        width={90}
        {...rest}
      />
    </Tooltip>
  );
}

UnloadIconBtn.propTypes = {
  clickhandler: PropTypes.func,
  disabled: PropTypes.bool,
};
