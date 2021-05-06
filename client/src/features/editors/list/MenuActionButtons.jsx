import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/menu';
import { IconButton } from '@chakra-ui/button';
import { FiZap, FiPlus, FiClock, FiMinusCircle } from 'react-icons/fi';
import { useEffect } from 'react';

export default function MenuActionButtons(props) {
  const { actionHandler } = props;
  const menuStyle = {
    color: '#000000',
    backgroundColor: 'rgba(255,255,255,1)',
  };

  useEffect(() =>{
    console.log('debug action button render')
  })

  return (
    <Menu isLazy lazyBehavior='unmount'>
      <MenuButton
        as={IconButton}
        aria-label='Options'
        size={props.size || 'xs'}
        icon={<FiZap />}
        _expanded={{ bg: 'pink.300', color: 'white' }}
        _focus={{ boxShadow: 'none' }}
        backgroundColor={'orange.200'}
        color={'orange.500'}
      />
      <MenuList style={menuStyle}>
        {/* <MenuItem icon={<FiTrash2 />} onClick={props.deleteAllHandler}>
          Delete All
        </MenuItem> */}
        <MenuItem icon={<FiPlus />} onClick={() => actionHandler('event')}>
          Event first
        </MenuItem>
        <MenuItem icon={<FiClock />} onClick={() => actionHandler('delay')}>
          Delay first
        </MenuItem>
        <MenuItem
          icon={<FiMinusCircle />}
          onClick={() => actionHandler('block')}
        >
          Block first
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
