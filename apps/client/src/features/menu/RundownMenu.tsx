import { memo, useCallback, useContext } from 'react';
import { Button, HStack, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Switch } from '@chakra-ui/react';
import { FiMinusCircle } from '@react-icons/all-files/fi/FiMinusCircle';
import { FiTrash2 } from '@react-icons/all-files/fi/FiTrash2';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoTimerOutline } from '@react-icons/all-files/io5/IoTimerOutline';

import { CursorContext } from '../../common/context/CursorContext';
import { useEventAction } from '../../common/hooks/useEventAction';
import { SupportedEvent } from '../../common/models/EventTypes';

import style from './RundownMenu.module.scss';

const RundownMenu = () => {
  const { isCursorLocked, toggleCursorLocked } = useContext(CursorContext);
  const { addEvent, deleteAllEvents } = useEventAction();

  // TODO: re-write this with stable functions
  type ActionTypes = SupportedEvent | 'delete-all';
  const eventAction = useCallback(
    (action: ActionTypes) => {
      switch (action) {
        case SupportedEvent.Event:
          addEvent({ type: action });
          break;
        case SupportedEvent.Delay:
          addEvent({ type: action });
          break;
        case SupportedEvent.Block:
          addEvent({ type: action });
          break;
        case 'delete-all':
          deleteAllEvents();
          break;
      }
    },
    [addEvent, deleteAllEvents],
  );

  return (
    <HStack className={style.headerButtons}>
      <label className={style.labelledSwitch}>
        <Switch
          defaultChecked={isCursorLocked}
          onChange={(event) => toggleCursorLocked(event.target.checked)}
          variant='ontime'
        />
        Lock cursor to current
      </label>
      <Menu isLazy lazyBehavior='unmount' variant='ontime-on-dark'>
        <MenuButton
          as={Button}
          leftIcon={<IoAdd />}
          size='sm'
          variant='ontime-subtle'
        >
          Event...
        </MenuButton>
        <MenuList>
          <MenuItem icon={<IoAdd />} onClick={() => eventAction(SupportedEvent.Event)}>
            Add event at start
          </MenuItem>
          <MenuItem icon={<IoTimerOutline />} onClick={() => eventAction(SupportedEvent.Delay)}>
            Add delay at start
          </MenuItem>
          <MenuItem icon={<FiMinusCircle />} onClick={() => eventAction(SupportedEvent.Block)}>
            Add block at start
          </MenuItem>
          <MenuDivider />
          <MenuItem icon={<FiTrash2 />} onClick={() => eventAction('delete-all')} color='#D20300'>
            Delete all events
          </MenuItem>
        </MenuList>
      </Menu>
    </HStack>
  );
};

export default memo(RundownMenu);
