import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/menu';
import { IconButton } from '@chakra-ui/button';
import { FiZap, FiPlus, FiMinusCircle, FiClock } from 'react-icons/fi';

export default function ActionButtons(props) {
  const { showAdd, showDelay, showBlock } = props;

  const menuStyle = {
    color: '#000000',
    backgroundColor: 'rgba(255,255,255,1)',
  };

  return (
    <Menu isLazy lazyBehavior='unmount'>
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
        <MenuItem
          icon={<FiPlus />}
          onClick={props.addHandler}
          isDisabled={!showAdd}
        >
          Event next
        </MenuItem>

        <MenuItem
          icon={<FiClock />}
          onClick={props.delayHandler}
          isDisabled={!showDelay}
        >
          Delay next
        </MenuItem>
        <MenuItem
          icon={<FiMinusCircle />}
          onClick={props.blockHandler}
          isDisabled={!showBlock}
        >
          Block next
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
