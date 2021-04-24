import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/menu';
import { IconButton } from '@chakra-ui/button';
import { FiZap, FiPlus, FiMinus, FiMinusCircle, FiClock } from 'react-icons/fi';

export default function ActionButtons(props) {
  const { showDel, showAdd, showDelay, showBlock } = props;

  const menuStyle = {
    color: '#000000',
    backgroundColor: 'rgba(255,255,255,0.67)',
  };

  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label='Options'
        size='xs'
        icon={<FiZap />}
        _expanded={{ bg: 'pink.300', color: 'white' }}
        _focus={{ boxShadow: 'none' }}
        backgroundColor={'orange.200'}
        color={'orange.500'}
      />
      <MenuList style={menuStyle}>
        {showDel && (
          <MenuItem icon={<FiMinus />} onClick={props.deleteHandler}>
            Delete
          </MenuItem>
        )}
        {showAdd && (
          <MenuItem icon={<FiPlus />} onClick={props.addHandler}>
            Event next
          </MenuItem>
        )}
        {showDelay && (
          <MenuItem icon={<FiClock />} onClick={props.delayHandler}>
            Delay next
          </MenuItem>
        )}
        {showBlock && (
          <MenuItem icon={<FiMinusCircle />} onClick={props.blockHandler}>
            Block next
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  );
}
