import { MenuDivider, MenuItem, MenuList, Portal } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoArrowDown } from '@react-icons/all-files/io5/IoArrowDown';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import { IoDuplicateOutline } from '@react-icons/all-files/io5/IoDuplicateOutline';
import { IoOptions } from '@react-icons/all-files/io5/IoOptions';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { isOntimeEvent, SupportedEvent } from 'ontime-types';

import { useEventAction } from '../../../../common/hooks/useEventAction';
import { cloneEvent } from '../../../../common/utils/eventsManager';

interface CuesheetTableMenuProps {
  eventId: string;
  entryIndex: number;
  showModal: (entryId: string) => void;
}

export default function CuesheetTableMenu(props: CuesheetTableMenuProps) {
  const { eventId, entryIndex, showModal } = props;
  const { addEvent, getEventById, reorderEvent, deleteEvent } = useEventAction();

  const handleCloneEvent = () => {
    const currentEvent = getEventById(eventId);
    if (!currentEvent || !isOntimeEvent(currentEvent)) {
      return;
    }

    const newEvent = cloneEvent(currentEvent);
    try {
      addEvent(newEvent, { after: eventId });
    } catch (_error) {
      // we do not handle errors here
    }
  };

  return (
    <Portal>
      <MenuList>
        <MenuItem icon={<IoOptions />} onClick={() => showModal(eventId)}>
          Edit ...
        </MenuItem>
        <MenuDivider />
        <MenuItem icon={<IoAdd />} onClick={() => addEvent({ type: SupportedEvent.Event }, { before: eventId })}>
          Add event above
        </MenuItem>
        <MenuItem icon={<IoAdd />} onClick={() => addEvent({ type: SupportedEvent.Event }, { after: eventId })}>
          Add event below
        </MenuItem>
        <MenuItem icon={<IoDuplicateOutline />} onClick={handleCloneEvent}>
          Clone event
        </MenuItem>
        <MenuDivider />
        <MenuItem
          isDisabled={entryIndex < 1}
          icon={<IoArrowUp />}
          onClick={() => reorderEvent(eventId, entryIndex, entryIndex - 1)}
        >
          Move up
        </MenuItem>
        <MenuItem icon={<IoArrowDown />} onClick={() => reorderEvent(eventId, entryIndex, entryIndex + 1)}>
          Move down
        </MenuItem>
        <MenuItem icon={<IoTrash />} onClick={() => deleteEvent([eventId])}>
          Delete
        </MenuItem>
      </MenuList>
    </Portal>
  );
}
