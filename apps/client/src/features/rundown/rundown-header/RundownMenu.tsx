import { memo, ReactNode } from 'react';
import { Menu } from '@mantine/core';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoRemoveCircleOutline } from '@react-icons/all-files/io5/IoRemoveCircleOutline';
import { IoTimerOutline } from '@react-icons/all-files/io5/IoTimerOutline';
import { IoTrashOutline } from '@react-icons/all-files/io5/IoTrashOutline';
import { SupportedEvent } from 'ontime-types';

import { useEventAction } from '../../../common/hooks/useEventAction';
import { useEventSelection } from '../useEventSelection';

const RundownMenu = ({ children }: { children: ReactNode }) => {
  const { clearSelectedEvents } = useEventSelection();
  const { addEvent, deleteAllEvents } = useEventAction();

  const newEvent = () => {
    addEvent({ type: SupportedEvent.Event });
  };

  const newBlock = () => {
    addEvent({ type: SupportedEvent.Block });
  };

  const newDelay = () => {
    addEvent({ type: SupportedEvent.Delay });
  };

  const deleteAll = () => {
    deleteAllEvents();
    clearSelectedEvents();
    // setCursor(null);
  };

  return (
    <Menu>
      <Menu.Target>{children}</Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IoAdd />} onClick={newEvent}>
          Add event at start
        </Menu.Item>
        <Menu.Item leftSection={<IoTimerOutline />} onClick={newDelay}>
          Add delay at start
        </Menu.Item>
        <Menu.Item leftSection={<IoRemoveCircleOutline />} onClick={newBlock}>
          Add block at start
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item leftSection={<IoTrashOutline />} onClick={deleteAll} color='#FA5656'>
          Delete all events
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

export default memo(RundownMenu);
