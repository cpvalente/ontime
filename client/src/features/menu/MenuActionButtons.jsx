import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/menu';
import { IconButton } from '@chakra-ui/button';
import { FiTrash2, FiPlus, FiClock, FiMinusCircle } from 'react-icons/fi';
import { Divider } from '@chakra-ui/layout';

export default function MenuActionButtons(props) {
  const { actionHandler } = props;
  const menuStyle = {
    color: '#000000',
    backgroundColor: 'rgba(255,255,255,1)',
  };

  return (
    <Menu isLazy lazyBehavior='unmount'>
      <MenuButton
        as={IconButton}
        aria-label='Create Menu'
        size={props.size || 'xs'}
        icon={<FiPlus />}
        _expanded={{ bg: 'orange.300', color: 'white' }}
        _focus={{ boxShadow: 'none' }}
        backgroundColor={'orange.200'}
        color={'orange.500'}
      />
      <MenuList style={menuStyle}>
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
        <Divider />
        <MenuItem
          icon={<FiTrash2 />}
          onClick={() => actionHandler('deleteall')}
          color='red.500'
        >
          Delete All
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
