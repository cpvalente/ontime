import { memo } from 'react';
import { IoAdd, IoArrowDown, IoArrowUp, IoDuplicateOutline, IoOptions, IoTrash } from 'react-icons/io5';
import { SupportedEntry } from 'ontime-types';

import { PositionedDropdownMenu } from '../../../../common/components/dropdown-menu/DropdownMenu';
import { useEntryActions } from '../../../../common/hooks/useEntryAction';
import { useCuesheetEditModal } from '../../cuesheet-edit-modal/useCuesheetEditModal';
import { useCuesheetPermissions } from '../../useTablePermissions';

import { useCuesheetTableMenu } from './useCuesheetTableMenu';

export default memo(CuesheetTableMenu);

function CuesheetTableMenu() {
  const { isOpen, entryId, entryIndex, parentId, flag, position, closeMenu } = useCuesheetTableMenu();
  const { addEntry, clone, deleteEntry, move, updateEntry } = useEntryActions();
  const showModal = useCuesheetEditModal((state) => state.setEditableEntry);
  const permissions = useCuesheetPermissions();

  if (!isOpen) {
    return null;
  }

  return (
    <PositionedDropdownMenu
      isOpen
      onClose={closeMenu}
      items={[
        {
          type: 'item',
          label: 'Edit...',
          onClick: () => showModal(entryId),
          icon: IoOptions,
          disabled: !permissions.canEditEntries,
        },
        { type: 'divider' },
        {
          type: 'item',
          label: flag ? 'Remove flag' : 'Add flag',
          onClick: () => updateEntry({ id: entryId, flag: !flag }),
          icon: IoDuplicateOutline,
          disabled: flag === null || !permissions.canFlag,
        },
        { type: 'divider' },
        {
          type: 'item',
          label: 'Add event above',
          onClick: () => addEntry({ type: SupportedEntry.Event, parent: parentId }, { before: entryId }),
          icon: IoAdd,
          disabled: !permissions.canCreateEntries,
        },
        {
          type: 'item',
          label: 'Add event below',
          onClick: () => addEntry({ type: SupportedEntry.Event, parent: parentId }, { after: entryId }),
          icon: IoAdd,
          disabled: !permissions.canCreateEntries,
        },
        {
          type: 'item',
          label: 'Clone event',
          onClick: () => clone(entryId),
          icon: IoDuplicateOutline,
          disabled: !permissions.canCreateEntries,
        },
        { type: 'divider' },
        {
          type: 'item',
          label: 'Move up',
          onClick: () => move(entryId, 'up'),
          icon: IoArrowUp,
          disabled: entryIndex < 1 || !permissions.canEditEntries,
        },
        {
          type: 'item',
          label: 'Move down',
          onClick: () => move(entryId, 'down'),
          icon: IoArrowDown,
          disabled: !permissions.canEditEntries,
        },
        { type: 'divider' },
        {
          type: 'item',
          label: 'Delete',
          onClick: () => deleteEntry([entryId]),
          icon: IoTrash,
          disabled: !permissions.canEditEntries,
        },
      ]}
      position={position}
    />
  );
}
