import { MenuDivider, MenuItem, MenuList } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoArrowDown } from '@react-icons/all-files/io5/IoArrowDown';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import { IoDuplicateOutline } from '@react-icons/all-files/io5/IoDuplicateOutline';
import { IoOptions } from '@react-icons/all-files/io5/IoOptions';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { OntimeEvent, SupportedEvent } from 'ontime-types';

import { useEventAction } from '../../../../common/hooks/useEventAction';
import { cloneEvent } from '../../../../common/utils/eventsManager';

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
    <MenuList>
      <MenuItem icon={<IoOptions />} onClick={() => showModal(event.id)}>
        Edit ...
      </MenuItem>
      <MenuDivider />
      <MenuItem icon={<IoAdd />} onClick={() => addEvent({ type: SupportedEvent.Event }, { before: event.id })}>
        Add event above
      </MenuItem>
      <MenuItem icon={<IoAdd />} onClick={() => addEvent({ type: SupportedEvent.Event }, { after: event.id })}>
        Add event below
      </MenuItem>
      <MenuItem icon={<IoDuplicateOutline />} onClick={handleCloneEvent}>
        Clone event
      </MenuItem>
      <MenuDivider />
      <MenuItem
        isDisabled={entryIndex < 1}
        icon={<IoArrowUp />}
        onClick={() => reorderEvent(event.id, entryIndex, entryIndex - 1)}
      >
        Move up
      </MenuItem>
      <MenuItem icon={<IoArrowDown />} onClick={() => reorderEvent(event.id, entryIndex, entryIndex + 1)}>
        Move down
      </MenuItem>
      <MenuItem icon={<IoTrash />} onClick={() => deleteEvent([event.id])}>
        Delete
      </MenuItem>
    </MenuList>
  );
}
