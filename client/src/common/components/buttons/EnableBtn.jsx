import React from 'react';
import { IoCloseSharp } from '@react-icons/all-files/io5/IoCloseSharp';
import { IoCheckmarkSharp } from '@react-icons/all-files/io5/IoCheckmarkSharp';
import { Button } from '@chakra-ui/button';

export default function EnableBtn(props) {
  const { active, text, actionHandler } = props;
  return (
    <Button
      size={props.size || 'xs'}
      leftIcon={active ? <IoCheckmarkSharp /> : <IoCloseSharp />}
      colorScheme='blue'
      variant={active ? 'solid' : 'outline'}
      onClick={actionHandler}
      _focus={{ boxShadow: 'none' }}
    >
      {text}
    </Button>
  );
}
