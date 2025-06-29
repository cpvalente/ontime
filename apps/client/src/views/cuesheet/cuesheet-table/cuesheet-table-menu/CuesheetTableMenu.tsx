import { memo } from 'react';
import { IoAdd, IoArrowDown, IoArrowUp, IoDuplicateOutline, IoOptions, IoTrash } from 'react-icons/io5';
import { Menu, MenuButton, MenuDivider, MenuItem, MenuList, Portal } from '@chakra-ui/react';
import { isOntimeEvent, SupportedEntry } from 'ontime-types';

import { useEntryActions } from '../../../../common/hooks/useEntryAction';
import { cloneEvent } from '../../../../common/utils/clone';
import { useCuesheetEditModal } from '../../cuesheet-edit-modal/useCuesheetEditModal';

import { useCuesheetTableMenu } from './useCuesheetTableMenu';

export default memo(CuesheetTableMenu);

function CuesheetTableMenu() {
  const { isOpen, eventId, entryIndex, position, closeMenu } = useCuesheetTableMenu();
  const { addEntry, getEntryById, move, deleteEntry } = useEntryActions();
  const showModal = useCuesheetEditModal((state) => state.setEditableEntry);

  const handleCloneEvent = () => {
    if (!eventId) {
      return;
    }

    const currentEvent = getEntryById(eventId);
    if (!currentEvent || !isOntimeEvent(currentEvent)) {
      return;
    }

    const newEvent = cloneEvent(currentEvent);
    try {
      addEntry(newEvent, { after: eventId });
    } catch (_error) {
      // we do not handle errors here
    }
  };

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
            <MenuItem icon={<IoOptions />} onClick={() => showModal(eventId)}>
              Edit ...
            </MenuItem>
            <MenuDivider />
            <MenuItem icon={<IoAdd />} onClick={() => addEntry({ type: SupportedEntry.Event }, { before: eventId })}>
              Add event above
            </MenuItem>
            <MenuItem icon={<IoAdd />} onClick={() => addEntry({ type: SupportedEntry.Event }, { after: eventId })}>
              Add event below
            </MenuItem>
            <MenuItem icon={<IoDuplicateOutline />} onClick={handleCloneEvent}>
              Clone event
            </MenuItem>
            <MenuDivider />
            <MenuItem isDisabled={entryIndex < 1} icon={<IoArrowUp />} onClick={() => move(eventId, 'up')}>
              Move up
            </MenuItem>
            <MenuItem icon={<IoArrowDown />} onClick={() => move(eventId, 'down')}>
              Move down
            </MenuItem>
            <MenuItem icon={<IoTrash />} onClick={() => deleteEntry([eventId])}>
              Delete
            </MenuItem>
          </MenuList>
        </Menu>
      )}
    </Portal>
  );
}
