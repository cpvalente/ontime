import { IoAdd, IoArrowDown, IoArrowUp, IoDuplicateOutline, IoOptions, IoTrash } from 'react-icons/io5';
import { MenuDivider, MenuItem, MenuList } from '@chakra-ui/react';
import { isOntimeEvent, SupportedEntry } from 'ontime-types';

import { useEntryActions } from '../../../../common/hooks/useEntryAction';
import { cloneEvent } from '../../../../common/utils/eventsManager';

interface CuesheetTableMenuActionsProps {
  eventId: string;
  entryIndex: number;
  showModal: (entryId: string) => void;
}

export default function CuesheetTableMenuActions(props: CuesheetTableMenuActionsProps) {
  const { eventId, entryIndex, showModal } = props;
  const { addEntry, getEntryById, reorderEntry, deleteEntry } = useEntryActions();

  const handleCloneEvent = () => {
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
      <MenuItem
        isDisabled={entryIndex < 1}
        icon={<IoArrowUp />}
        onClick={() => reorderEntry(eventId, entryIndex, entryIndex - 1)}
      >
        Move up
      </MenuItem>
      <MenuItem icon={<IoArrowDown />} onClick={() => reorderEntry(eventId, entryIndex, entryIndex + 1)}>
        Move down
      </MenuItem>
      <MenuItem icon={<IoTrash />} onClick={() => deleteEntry([eventId])}>
        Delete
      </MenuItem>
    </MenuList>
  );
}
