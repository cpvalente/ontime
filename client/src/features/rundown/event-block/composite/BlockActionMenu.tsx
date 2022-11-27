import {
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Tooltip,
} from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoDuplicateOutline } from '@react-icons/all-files/io5/IoDuplicateOutline';
import { IoRemoveCircleOutline } from '@react-icons/all-files/io5/IoRemoveCircleOutline';
import { IoTimerOutline } from '@react-icons/all-files/io5/IoTimerOutline';
import { IoTrashBinSharp } from '@react-icons/all-files/io5/IoTrashBinSharp';

import { tooltipDelayMid } from '../../../../ontimeConfig';
import { EventItemActions } from '../../RundownEntry';

interface BlockActionMenuProps {
  showAdd?: boolean;
  showDelay?: boolean;
  showBlock?: boolean;
  enableDelete?: boolean;
  showClone?: boolean;
  actionHandler: (action: EventItemActions, payload?: any) => void;
  className?: string;
}
export default function BlockActionMenu(props: BlockActionMenuProps) {
  const { showAdd, showDelay, showBlock, enableDelete, showClone, actionHandler, className } = props;

  return (
    <Menu isLazy lazyBehavior='unmount' variant='ontime-on-dark'>
      <Tooltip label='Add ...' openDelay={tooltipDelayMid}>
        <MenuButton
          as={IconButton}
          aria-label='Event options'
          icon={<IoAdd />}
          tabIndex={-1}
          variant='ontime-subtle'
          color='#f6f6f6'
          size='sm'
          className={className}
        />
      </Tooltip>
      <MenuList>
        <MenuItem icon={<IoAdd />} onClick={() => actionHandler('event')} isDisabled={!showAdd}>
          Add Event after
        </MenuItem>
        <MenuItem
          icon={<IoTimerOutline />}
          onClick={() => actionHandler('delay')}
          isDisabled={!showDelay}
        >
          Add Delay after
        </MenuItem>
        <MenuItem
          icon={<IoRemoveCircleOutline />}
          onClick={() => actionHandler('block')}
          isDisabled={!showBlock}
        >
          Add Block after
        </MenuItem>
        {showClone && (
          <MenuItem
            icon={<IoDuplicateOutline />}
            onClick={() => actionHandler('clone')}
            isDisabled={!showBlock}
          >
            Clone event
          </MenuItem>
        )}
        <MenuDivider />
        <MenuItem
          icon={<IoTrashBinSharp />}
          onClick={() => actionHandler('delete')}
          isDisabled={!enableDelete}
          color='#D20300'
        >
          Delete event
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
