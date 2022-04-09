import React from 'react';
import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/menu';
import { IconButton } from '@chakra-ui/button';
import { FiClock } from '@react-icons/all-files/fi/FiClock';
import { FiMinusCircle } from '@react-icons/all-files/fi/FiMinusCircle';
import { FiPlus } from '@react-icons/all-files/fi/FiPlus';
import { Tooltip } from '@chakra-ui/tooltip';

export default function ActionButtons(props) {
  const { showAdd, showDelay, showBlock, actionHandler } = props;

  const menuStyle = {
    color: '#000000',
    backgroundColor: 'rgba(255,255,255,1)',
  };

  return (
    <Menu isLazy lazyBehavior='unmount'>
      <Tooltip label='Add ...' delay={500}>
        <MenuButton
          as={IconButton}
          aria-label='Options'
          size='xs'
          icon={<FiPlus />}
          _expanded={{ bg: 'orange.300', color: 'white' }}
          _focus={{ boxShadow: 'none' }}
          backgroundColor='orange.200'
          color='orange.500'
        />
      </Tooltip>
      <MenuList style={menuStyle}>
        <MenuItem icon={<FiPlus />} onClick={() => actionHandler('event')} isDisabled={!showAdd}>
          Add Event after
        </MenuItem>

        <MenuItem icon={<FiClock />} onClick={() => actionHandler('delay')} isDisabled={!showDelay}>
          Add Delay after
        </MenuItem>
        <MenuItem
          icon={<FiMinusCircle />}
          onClick={() => actionHandler('block')}
          isDisabled={!showBlock}
        >
          Add Block after
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
