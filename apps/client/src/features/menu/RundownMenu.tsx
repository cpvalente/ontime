import { memo, useCallback } from 'react';
import { Button, Menu, MenuButton, MenuDivider, MenuItem, MenuList } from '@chakra-ui/react';
import { FiMinusCircle } from '@react-icons/all-files/fi/FiMinusCircle';
import { FiTrash2 } from '@react-icons/all-files/fi/FiTrash2';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoTimerOutline } from '@react-icons/all-files/io5/IoTimerOutline';
import { SupportedEvent } from 'ontime-types';

import { useEventAction } from '../../common/hooks/useEventAction';
import { useAppMode } from '../../common/stores/appModeStore';

import style from './RundownMenu.module.scss';

const RundownMenu = () => {
  const setEditId = useAppMode((state) => state.setEditId);
  const setCursor = useAppMode((state) => state.setCursor);

  const { addEvent, deleteAllEvents } = useEventAction();

  const newEvent = useCallback(() => {
    addEvent({ type: SupportedEvent.Event });
  }, [addEvent]);

  const newBlock = useCallback(() => {
    addEvent({ type: SupportedEvent.Block });
  }, [addEvent]);

  const newDelay = useCallback(() => {
    addEvent({ type: SupportedEvent.Delay });
  }, [addEvent]);

  const deleteAll = useCallback(() => {
    deleteAllEvents();
    setEditId(null);
    setCursor(null);
  }, [deleteAllEvents, setCursor, setEditId]);

  return (
    <div className={style.headerButtons}>
      <Menu isLazy lazyBehavior='unmount' variant='ontime-on-dark'>
        <MenuButton as={Button} leftIcon={<IoAdd />} size='sm' variant='ontime-subtle'>
          Event...
        </MenuButton>
        <MenuList>
          <MenuItem icon={<IoAdd />} onClick={newEvent}>
            Add event at start
          </MenuItem>
          <MenuItem icon={<IoTimerOutline />} onClick={newDelay}>
            Add delay at start
          </MenuItem>
          <MenuItem icon={<FiMinusCircle />} onClick={newBlock}>
            Add block at start
          </MenuItem>
          <MenuDivider />
          <MenuItem icon={<FiTrash2 />} onClick={deleteAll} color='#D20300'>
            Delete all events
          </MenuItem>
        </MenuList>
      </Menu>
    </div>
  );
};

export default memo(RundownMenu);
