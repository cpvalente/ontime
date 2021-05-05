import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/menu';
import { IconButton } from '@chakra-ui/button';
import {
  FiZap,
  FiTrash2,
} from 'react-icons/fi';

export default function MenuActionButtons(props) {
  const menuStyle = {
    color: '#000000',
    backgroundColor: 'rgba(255,255,255,1)',
  };

  return (
    <Menu>
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
        <MenuItem icon={<FiTrash2 />} onClick={props.deleteAllHandler}>
          Delete All
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
