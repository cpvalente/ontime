import { useCallback } from 'react';
import { IconButton, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Tooltip } from '@chakra-ui/react';
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
    <Menu isLazy lazyBehavior='unmount' variant='ontime-on-dark'>
      <Tooltip label='Add ...' openDelay={tooltipDelayMid}>
        <MenuButton
          as={IconButton}
          aria-label='Event options'
          icon={<IoEllipsisHorizontal />}
          tabIndex={-1}
          variant='ontime-ghosted-white'
          size='sm'
          className={className}
        />
      </Tooltip>
      <MenuList>
        <MenuItem icon={<IoAdd />} onClick={handleAddEvent}>
          Add Event after
        </MenuItem>
        <MenuItem icon={<IoTimerOutline />} onClick={handleAddDelay}>
          Add Delay after
        </MenuItem>
        <MenuItem icon={<IoRemoveCircleOutline />} onClick={handleAddBlock}>
          Add Block after
        </MenuItem>
        {showClone && (
          <MenuItem icon={<IoDuplicateOutline />} onClick={handleClone}>
            Clone event
          </MenuItem>
        )}
        <MenuDivider />
        <MenuItem icon={<IoTrashBinSharp />} onClick={handleDelete} isDisabled={!enableDelete} color='#FA5656'>
          Delete
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
