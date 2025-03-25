import { IoAdd, IoArrowDown, IoArrowUp, IoDuplicateOutline, IoOptions, IoTrash } from 'react-icons/io5';
import { MenuDivider, MenuItem, MenuList } from '@chakra-ui/react';
import { isOntimeEvent, SupportedEvent } from 'ontime-types';

import { useEventAction } from '../../../../common/hooks/useEventAction';
import { cloneEvent } from '../../../../common/utils/eventsManager';

interface CuesheetTableMenuActionsProps {
  eventId: string;
  entryIndex: number;
  showModal: (entryId: string) => void;
}

export default function CuesheetTableMenuActions(props: CuesheetTableMenuActionsProps) {
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
  );
}
