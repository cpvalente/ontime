import { useCallback } from 'react';
import { ActionIcon, Menu, Tooltip } from '@mantine/core';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoDuplicateOutline } from '@react-icons/all-files/io5/IoDuplicateOutline';
import { IoEllipsisHorizontal } from '@react-icons/all-files/io5/IoEllipsisHorizontal';
import { IoRemoveCircleOutline } from '@react-icons/all-files/io5/IoRemoveCircleOutline';
import { IoTimerOutline } from '@react-icons/all-files/io5/IoTimerOutline';
import { IoTrashBinSharp } from '@react-icons/all-files/io5/IoTrashBinSharp';

import { tooltipDelayMid } from '../../../../ontimeConfig';
import { EventItemActions } from '../../RundownEntry';

interface BlockActionMenuProps {
  enableDelete?: boolean;
  showClone?: boolean;
  actionHandler: (action: EventItemActions, payload?: any) => void;
  className?: string;
}

export default function BlockActionMenu(props: BlockActionMenuProps) {
  const { enableDelete, showClone, actionHandler, className } = props;

  const handleAddEvent = useCallback(() => actionHandler('event'), [actionHandler]);
  const handleAddDelay = useCallback(() => actionHandler('delay'), [actionHandler]);
  const handleAddBlock = useCallback(() => actionHandler('block'), [actionHandler]);
  const handleClone = useCallback(() => actionHandler('clone'), [actionHandler]);
  const handleDelete = useCallback(() => actionHandler('delete'), [actionHandler]);

  return (
    <Menu>
      <Tooltip label='Add ...' openDelay={tooltipDelayMid}>
        <ActionIcon
          aria-label='Event options'
          tabIndex={-1}
          variant='ontime-ghosted-white'
          size='sm'
          className={className}
        >
          <IoEllipsisHorizontal />
        </ActionIcon>
      </Tooltip>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IoAdd />} onClick={handleAddEvent}>
          Add Event after
        </Menu.Item>
        <Menu.Item leftSection={<IoTimerOutline />} onClick={handleAddDelay}>
          Add Delay after
        </Menu.Item>
        <Menu.Item leftSection={<IoRemoveCircleOutline />} onClick={handleAddBlock}>
          Add Block after
        </Menu.Item>
        {showClone && (
          <Menu.Item leftSection={<IoDuplicateOutline />} onClick={handleClone}>
            Clone event
          </Menu.Item>
        )}
        <Menu.Divider />
        <Menu.Item leftSection={<IoTrashBinSharp />} onClick={handleDelete} disabled={!enableDelete} color='#D20300'>
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
