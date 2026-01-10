import { memo } from 'react';
import { IoAdd } from 'react-icons/io5';
import { MaybeString, SupportedEntry } from 'ontime-types';

import IconButton from '../../../../common/components/buttons/IconButton';
import { DropdownMenu } from '../../../../common/components/dropdown-menu/DropdownMenu';
import { useEntryActionsContext } from '../../../../common/context/EntryActionsContext';

import style from './QuickAddInline.module.scss';

interface QuickAddInlineProps {
  referenceEntryId: MaybeString;
  parentGroup: MaybeString;
  placement: 'before' | 'after';
}

export default memo(QuickAddInline);
function QuickAddInline({ referenceEntryId, parentGroup, placement }: QuickAddInlineProps) {
  const { addEntry } = useEntryActionsContext();

  const handleAddEntry = (type: SupportedEntry) => {
    if (placement === 'before') {
      addEntry(
        { type, parent: type !== SupportedEntry.Group ? parentGroup : null },
        {
          before: referenceEntryId,
        },
      );
    } else {
      addEntry(
        { type, parent: type !== SupportedEntry.Group ? parentGroup : null },
        {
          lastEventId: referenceEntryId,
          after: referenceEntryId,
        },
      );
    }
  };

  return (
    <div className={style.quickAdd} data-testid='quick-add-inline'>
      <DropdownMenu
        items={[
          { type: 'item', icon: IoAdd, label: 'Add Event', onClick: () => handleAddEntry(SupportedEntry.Event) },
          { type: 'item', icon: IoAdd, label: 'Add Delay', onClick: () => handleAddEntry(SupportedEntry.Delay) },
          {
            type: 'item',
            icon: IoAdd,
            label: 'Add Milestone',
            onClick: () => handleAddEntry(SupportedEntry.Milestone),
          },
          {
            type: 'item',
            icon: IoAdd,
            label: 'Add Group',
            onClick: () => handleAddEntry(SupportedEntry.Group),
            disabled: parentGroup !== null,
          },
        ]}
        render={<IconButton size='small' variant='primary' className={style.addButton} />}
      >
        <IoAdd />
      </DropdownMenu>
    </div>
  );
}
