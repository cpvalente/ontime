import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { IoArrowUndo } from '@react-icons/all-files/io5/IoArrowUndo';
import { Tooltip } from '@chakra-ui/tooltip';
import PropTypes from 'prop-types';

export default function ReloadIconButton(props) {
  const { clickhandler, disabled, ...rest } = props;
  return (
    <Tooltip label='Reload event' openDelay={500} shouldWrapChildren={disabled}>
      <IconButton
        icon={<IoArrowUndo size='22px' />}
        colorScheme='whiteAlpha'
        backgroundColor='#ffffff05'
        variant='outline'
        onClick={clickhandler}
        width={90}
        {...rest}
      />
    </Tooltip>
  );
}

ReloadIconButton.propTypes = {
  clickhandler: PropTypes.func,
  disabled: PropTypes.bool,
};
