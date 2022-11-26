import {
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Tooltip,
} from '@chakra-ui/react';
import { FiMinusCircle } from '@react-icons/all-files/fi/FiMinusCircle';
import { FiTrash2 } from '@react-icons/all-files/fi/FiTrash2';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoDuplicateOutline } from '@react-icons/all-files/io5/IoDuplicateOutline';
import { IoTimerOutline } from '@react-icons/all-files/io5/IoTimerOutline';

import { tooltipDelayMid } from '../../../../ontimeConfig';
import { EventItemActions } from '../../RundownEntry';

interface EventBlockActionMenuProps {
  showAdd: boolean;
  showDelay: boolean;
  showBlock: boolean;
  showClone: boolean;
  actionHandler: (action: EventItemActions, payload?: any) => void;
}
export default function EventBlockActionMenu(props: EventBlockActionMenuProps) {
  const { showAdd, showDelay, showBlock, showClone, actionHandler } = props;

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
          icon={<FiMinusCircle />}
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
          icon={<FiTrash2 />}
          onClick={() => actionHandler('delete')}
          isDisabled={!showBlock}
          color='#D20300'
        >
          Delete event
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
