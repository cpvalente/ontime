import { IoAdd } from 'react-icons/io5';
import { IoArrowDown } from 'react-icons/io5';
import { IoArrowUp } from 'react-icons/io5';
import { IoDuplicateOutline } from 'react-icons/io5';
import { IoOptions } from 'react-icons/io5';
import { IoTrash } from 'react-icons/io5';
import { isOntimeEvent, SupportedEvent } from 'ontime-types';

import { MenuContent, MenuItem, MenuSeparator } from '../../../../common/components/ui/menu';
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
    <MenuContent>
      <MenuItem value='edit' onClick={() => showModal(eventId)}>
        <IoOptions /> Edit ...
      </MenuItem>
      <MenuSeparator />
      <MenuItem value='addEventAbove' onClick={() => addEvent({ type: SupportedEvent.Event }, { before: eventId })}>
        <IoAdd /> Add event above
      </MenuItem>
      <MenuItem value='addEventBelow' onClick={() => addEvent({ type: SupportedEvent.Event }, { after: eventId })}>
        <IoAdd /> Add event below
      </MenuItem>
      <MenuItem onClick={handleCloneEvent} value='cloneEvent'>
        <IoDuplicateOutline /> Clone event
      </MenuItem>
      <MenuSeparator />
      <MenuItem
        value='moveUp'
        disabled={entryIndex < 1}
        onClick={() => reorderEvent(eventId, entryIndex, entryIndex - 1)}
      >
        <IoArrowUp /> Move up
      </MenuItem>
      <MenuItem value='moveDown' onClick={() => reorderEvent(eventId, entryIndex, entryIndex + 1)}>
        <IoArrowDown /> Move down
      </MenuItem>
      <MenuItem value='delete' onClick={() => deleteEvent([eventId])}>
        <IoTrash /> Delete
      </MenuItem>
    </MenuContent>
  );
}
