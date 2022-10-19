import {
  IconButton,
  Divider,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tooltip,
} from '@chakra-ui/react';
import { FiClock } from '@react-icons/all-files/fi/FiClock';
import { FiMinusCircle } from '@react-icons/all-files/fi/FiMinusCircle';
import { FiPlus } from '@react-icons/all-files/fi/FiPlus';
import { FiTrash2 } from '@react-icons/all-files/fi/FiTrash2';
import { useEventAction } from 'common/hooks/useEventAction';
import { Size } from 'common/models/UtilTypes';


interface MenuActionButtonsProps {
  actionHandler: (action: string) => void;
  size?: Size;
}

// Todo: add useEventActionsHook
export default function MenuActionButtons(props: MenuActionButtonsProps) {
  const { actionHandler, size = 'xs' } = props;
  const { deleteAllEvents } = useEventAction();
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
          size={size}
          icon={<FiPlus />}
          colorScheme='blue'
        />
      </Tooltip>
      <MenuList style={menuStyle}>
        <MenuItem icon={<FiPlus />} onClick={() => actionHandler('event')}>
          Add Event first
        </MenuItem>
        <MenuItem icon={<FiClock />} onClick={() => actionHandler('delay')}>
          Add Delay first
        </MenuItem>
        <MenuItem icon={<FiMinusCircle />} onClick={() => actionHandler('block')}>
          Add Block first
        </MenuItem>
        <Divider />
        <MenuItem icon={<FiTrash2 />} onClick={() => deleteAllEvents()} color='red.500'>
          Delete All
        </MenuItem>
      </MenuList>
    </Menu>
  );
}

