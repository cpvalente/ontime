import React from 'react';
import { Button } from '@chakra-ui/button';
import { IoCheckmarkSharp } from '@react-icons/all-files/io5/IoCheckmarkSharp';
import { IoCloseSharp } from '@react-icons/all-files/io5/IoCloseSharp';
import PropTypes from 'prop-types';

export default function EnableBtn(props) {
  const { active, text, actionHandler, size = 'xs' } = props;
  return (
    <Button
      size={size}
      leftIcon={active ? <IoCheckmarkSharp /> : <IoCloseSharp />}
      colorScheme='blue'
      variant={active ? 'solid' : 'outline'}
      onClick={actionHandler}
    >
      {text}
    </Button>
  );
}

EnableBtn.propTypes = {
  active: PropTypes.bool,
  text: PropTypes.string,
  actionHandler: PropTypes.func,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
}
