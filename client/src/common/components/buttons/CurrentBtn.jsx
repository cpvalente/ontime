import React from 'react';
import { Button } from '@chakra-ui/button';
import { FiTarget } from '@react-icons/all-files/fi/FiTarget';

export default function CurrentBtn(props) {
  const { clickhandler, active, size = 'xs' } = props;
  return (
    <Button
      size={size}
      leftIcon={<FiTarget />}
      colorScheme='whiteAlpha'
      variant={active ? 'solid' : 'outline'}
      onClick={clickhandler}
      _focus={{ boxShadow: 'none' }}
    >
      Goto Current
    </Button>
  );
}
