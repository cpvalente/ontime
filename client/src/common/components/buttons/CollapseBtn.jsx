import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiChevronsUp } from '@react-icons/all-files/fi/FiChevronsUp';

export default function CollapseBtn(props) {
  const { clickhandler } = props;
  return (
    <Tooltip label='Collapse all'>
      <IconButton
        size={props.size || 'xs'}
        icon={<FiChevronsUp />}
        colorScheme='white'
        variant='outline'
        background='#fff1'
        onClick={clickhandler}
        _focus={{ boxShadow: 'none' }}
      />
    </Tooltip>
  );
}
