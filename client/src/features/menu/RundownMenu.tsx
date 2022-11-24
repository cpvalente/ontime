import { memo, useCallback, useContext } from 'react';
import {
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Switch,
} from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { CursorContext } from 'common/context/CursorContext';

import { useEventAction } from '../../common/hooks/useEventAction';

import style from './RundownMenu.module.scss';

const RundownMenu = () => {
  const { isCursorLocked, toggleCursorLocked } = useContext(CursorContext);
  const { addEvent, deleteAllEvents } = useEventAction();

  type ActionTypes = 'event' | 'delay' | 'block' | 'delete-all';
  const eventAction = useCallback(
    (action: ActionTypes) => {
      switch (action) {
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
          Add event
        </MenuButton>
        <MenuList>
          <MenuItem onClick={() => eventAction('event')}>
            Event at start
          </MenuItem>
          <MenuItem onClick={() => eventAction('delay')}>
            Delay at start
          </MenuItem>
          <MenuItem onClick={() => eventAction('block')}>
            Block at start
          </MenuItem>
          <MenuDivider />
          <MenuItem icon={<IoTrash />} onClick={() => eventAction('delete-all')} color='#D20300'>
            Delete All
          </MenuItem>
        </MenuList>
      </Menu>
    </HStack>
  );
};

export default memo(RundownMenu);
