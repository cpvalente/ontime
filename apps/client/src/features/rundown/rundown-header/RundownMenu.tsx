import { memo, ReactNode, useCallback } from 'react';
import { Menu, MenuDivider, MenuItem, MenuList } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoRemoveCircleOutline } from '@react-icons/all-files/io5/IoRemoveCircleOutline';
import { IoTimerOutline } from '@react-icons/all-files/io5/IoTimerOutline';
import { IoTrashOutline } from '@react-icons/all-files/io5/IoTrashOutline';
import { SupportedEvent } from 'ontime-types';

import { useEventAction } from '../../../common/hooks/useEventAction';
import { useAppMode } from '../../../common/stores/appModeStore';
import { useEventSelection } from '../useEventSelection';

const RundownMenu = ({ children }: { children: ReactNode }) => {
  const clearSelectedEvents = useEventSelection((state) => state.clearSelectedEvents);
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
    clearSelectedEvents();
    setCursor(null);
  }, [clearSelectedEvents, deleteAllEvents, setCursor]);

  return (
    <Menu isLazy lazyBehavior='unmount' variant='ontime-on-dark' placement='right-start'>
      {children}
      <MenuList>
        <MenuItem icon={<IoAdd />} onClick={newEvent}>
          Add event at start
        </MenuItem>
        <MenuItem icon={<IoTimerOutline />} onClick={newDelay}>
          Add delay at start
        </MenuItem>
        <MenuItem icon={<IoRemoveCircleOutline />} onClick={newBlock}>
          Add block at start
        </MenuItem>
        <MenuDivider />
        <MenuItem icon={<IoTrashOutline />} onClick={deleteAll} color='#D20300'>
          Delete all events
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default memo(RundownMenu);
