import { memo } from 'react';
import { IoAdd, IoArrowDown, IoArrowUp, IoDuplicateOutline, IoOptions, IoTrash } from 'react-icons/io5';
import { Menu, MenuButton, MenuDivider, MenuItem, MenuList, Portal } from '@chakra-ui/react';
import { SupportedEntry } from 'ontime-types';

import { useEntryActions } from '../../../../common/hooks/useEntryAction';
import { useCuesheetEditModal } from '../../cuesheet-edit-modal/useCuesheetEditModal';

import { useCuesheetTableMenu } from './useCuesheetTableMenu';

export default memo(CuesheetTableMenu);

function CuesheetTableMenu() {
  const { isOpen, entryId, entryIndex, parentId, position, closeMenu } = useCuesheetTableMenu();
  const { addEntry, clone, deleteEntry, move } = useEntryActions();
  const showModal = useCuesheetEditModal((state) => state.setEditableEntry);

  return (
    <Portal>
      {isOpen && (
        <Menu isOpen size='sm' onClose={closeMenu} isLazy variant='ontime-on-dark'>
          <MenuButton
            position='absolute'
            left={position.x}
            top={position.y}
            pointerEvents='none'
            aria-hidden
            w={1}
            h={1}
          />
          <MenuList>
            <MenuItem icon={<IoOptions />} onClick={() => showModal(entryId)}>
              Edit ...
            </MenuItem>
            <MenuDivider />
            <MenuItem
              icon={<IoAdd />}
              onClick={() => addEntry({ type: SupportedEntry.Event, parent: parentId }, { before: entryId })}
            >
              Add event above
            </MenuItem>
            <MenuItem
              icon={<IoAdd />}
              onClick={() => addEntry({ type: SupportedEntry.Event, parent: parentId }, { after: entryId })}
            >
              Add event below
            </MenuItem>
            <MenuItem icon={<IoDuplicateOutline />} onClick={() => clone(entryId)}>
              Clone event
            </MenuItem>
            <MenuDivider />
            <MenuItem isDisabled={entryIndex < 1} icon={<IoArrowUp />} onClick={() => move(entryId, 'up')}>
              Move up
            </MenuItem>
            <MenuItem icon={<IoArrowDown />} onClick={() => move(entryId, 'down')}>
              Move down
            </MenuItem>
            <MenuItem icon={<IoTrash />} onClick={() => deleteEntry([entryId])}>
              Delete
            </MenuItem>
          </MenuList>
        </Menu>
      )}
    </Portal>
  );
}
