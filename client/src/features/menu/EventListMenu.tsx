import { memo, useCallback, useContext } from 'react';
import {
  Button,
  Divider,
  HStack,
  IconButton,
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
import { CursorContext } from 'common/context/CursorContext';

import { useEventAction } from '../../common/hooks/useEventAction';

import style from './EventListMenu.module.scss';

const menuStyle = {
  color: '#000000',
  backgroundColor: 'rgba(255,255,255,1)',
};

const EventListMenu = () => {
  const { isCursorLocked, toggleCursorLocked } = useContext(CursorContext);
  const { addEvent, deleteAllEvents } = useEventAction();

  type ActionTypes = 'event' | 'delay' | 'block' | 'delete-all' | 'toggle-lock';
  const actionHandler = useCallback(
    (action: ActionTypes) => {
      switch (action) {
        case 'toggle-lock':
          toggleCursorLocked();
          break;
        case 'event':
          addEvent({ type: action });
          break;
        case 'delay':
          addEvent({ type: action });
          break;
        case 'block':
          addEvent({ type: action });
          break;
        case 'delete-all':
          deleteAllEvents();
          break;
      }
    },
    [toggleCursorLocked],
  );

  return (
    <HStack className={style.headerButtons}>
      <Button
        size='sm'
        variant={isCursorLocked ? 'solid' : 'ghost'}
        onClick={() => actionHandler('toggle-lock')}
        colorScheme='blue'
      >
        Lock cursor to current
      </Button>
      <Menu isLazy lazyBehavior='unmount'>
        <Tooltip label='Add / Delete ...'>
          <MenuButton
            as={IconButton}
            aria-label='Create Menu'
            size='sm'
            icon={<FiPlus />}
            colorScheme='blue'
            variant='outline'
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
          <MenuItem icon={<FiTrash2 />} onClick={() => actionHandler('delete-all')} color='red.500'>
            Delete All
          </MenuItem>
        </MenuList>
      </Menu>
    </HStack>
  );
};

export default memo(EventListMenu);
