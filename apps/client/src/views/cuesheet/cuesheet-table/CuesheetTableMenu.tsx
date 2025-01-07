import { IoAdd } from 'react-icons/io5';
import { IoArrowDown } from 'react-icons/io5';
import { IoArrowUp } from 'react-icons/io5';
import { IoDuplicateOutline } from 'react-icons/io5';
import { IoOptions } from 'react-icons/io5';
import { IoTrash } from 'react-icons/io5';
import { OntimeEvent, SupportedEvent } from 'ontime-types';

import { MenuContent, MenuItem, MenuSeparator } from '../../../common/components/ui/menu';
import { useEventAction } from '../../../common/hooks/useEventAction';
import { cloneEvent } from '../../../common/utils/eventsManager';

interface CuesheetTableMenuProps {
  event: OntimeEvent;
  entryIndex: number;
  showModal: (entryId: string) => void;
}

export default function CuesheetTableMenu(props: CuesheetTableMenuProps) {
  const { event, entryIndex, showModal } = props;
  const { addEvent, reorderEvent, deleteEvent } = useEventAction();

  const handleCloneEvent = () => {
    const newEvent = cloneEvent(event);
    try {
      addEvent(newEvent, { after: event.id });
    } catch (_error) {
      // we do not handle errors here
    }
  };

  return (
    <MenuContent>
      <MenuItem onClick={() => showModal(event.id)} value='edit'>
        <IoOptions /> Edit ...
      </MenuItem>
      <MenuSeparator />
      <MenuItem onClick={() => addEvent({ type: SupportedEvent.Event }, { before: event.id })} value='addEventAbove'>
        <IoAdd /> Add event above
      </MenuItem>
      <MenuItem onClick={() => addEvent({ type: SupportedEvent.Event }, { after: event.id })} value='addEventBelow'>
        <IoAdd /> Add event below
      </MenuItem>
      <MenuItem onClick={handleCloneEvent} value='cloneEvent'>
        <IoDuplicateOutline /> Clone event
      </MenuItem>
      <MenuSeparator />
      <MenuItem
        disabled={entryIndex < 1}
        onClick={() => reorderEvent(event.id, entryIndex, entryIndex - 1)}
        value='moveUp'
      >
        <IoArrowUp /> Move up
      </MenuItem>
      <MenuItem onClick={() => reorderEvent(event.id, entryIndex, entryIndex + 1)} value='moveDown'>
        <IoArrowDown /> Move down
      </MenuItem>
      <MenuItem onClick={() => deleteEvent([event.id])} value='delete'>
        <IoTrash /> Delete
      </MenuItem>
    </MenuContent>
  );
}
