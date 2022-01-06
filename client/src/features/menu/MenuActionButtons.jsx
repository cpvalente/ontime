import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/menu';
import { IconButton } from '@chakra-ui/button';
import { FiClock, FiMinusCircle, FiPlus, FiTrash2 } from 'react-icons/fi';
import { Divider } from '@chakra-ui/layout';
import { Tooltip } from '@chakra-ui/tooltip';

export default function MenuActionButtons(props) {
  const { actionHandler } = props;
  const menuStyle = {
    color: '#000000',
    backgroundColor: 'rgba(255,255,255,1)',
  };

  return (
    <Menu isLazy lazyBehavior='unmount'>
      <Tooltip label='Add / Delete ...'>
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
      </Tooltip>
      <MenuList style={menuStyle}>
        <MenuItem icon={<FiPlus />} onClick={() => actionHandler('event')}>
          Add Event first
        </MenuItem>
        <MenuItem icon={<FiClock />} onClick={() => actionHandler('delay')}>
          Add Delay first
        </MenuItem>
        <MenuItem
          icon={<FiMinusCircle />}
          onClick={() => actionHandler('block')}
        >
          Add Block first
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
