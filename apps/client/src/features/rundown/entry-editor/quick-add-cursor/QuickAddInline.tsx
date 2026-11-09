import { MaybeString, SupportedEntry } from 'ontime-types';
import { memo } from 'react';
import { IoAdd } from 'react-icons/io5';

import IconButton from '../../../../common/components/buttons/IconButton';
import { DropdownMenu } from '../../../../common/components/dropdown-menu/DropdownMenu';
import { useEntryActionsContext } from '../../../../common/context/EntryActionsContext';
import { deviceAlt } from '../../../../common/utils/deviceUtils';
import { cx } from '../../../../common/utils/styleUtils';

import style from './QuickAddInline.module.scss';

interface QuickAddInlineProps {
  referenceEntryId: MaybeString;
  parentGroup: MaybeString;
  placement: 'before' | 'after';
}

export default memo(QuickAddInline);
function QuickAddInline({ referenceEntryId, parentGroup, placement }: QuickAddInlineProps) {
  const { addEntry } = useEntryActionsContext();
  const label = parentGroup ? `Insert ${placement} into group` : `Insert ${placement}`;
  const shortcut = (key: string) => `${deviceAlt} + ${placement === 'before' ? 'Shift + ' : ''}${key}`;

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
    <div className={cx([style.quickAdd, Boolean(parentGroup) && style.indent])} data-testid='quick-add-inline'>
      <DropdownMenu
        items={[
          { type: 'header', label },
          {
            type: 'item',
            icon: IoAdd,
            label: 'Add Event',
            shortcut: shortcut('E'),
            onClick: () => handleAddEntry(SupportedEntry.Event),
          },
          {
            type: 'item',
            icon: IoAdd,
            label: 'Add Delay',
            shortcut: shortcut('D'),
            onClick: () => handleAddEntry(SupportedEntry.Delay),
          },
          {
            type: 'item',
            icon: IoAdd,
            label: 'Add Milestone',
            shortcut: shortcut('M'),
            onClick: () => handleAddEntry(SupportedEntry.Milestone),
          },
          {
            type: 'item',
            icon: IoAdd,
            label: 'Add Group',
            description: parentGroup ? 'Groups cannot be nested' : undefined,
            shortcut: parentGroup ? undefined : shortcut('G'),
            onClick: () => handleAddEntry(SupportedEntry.Group),
            disabled: parentGroup !== null,
          },
        ]}
        render={<IconButton size='small' variant='primary' className={style.addButton} />}
        aria-label={label}
        title={label}
      >
        <IoAdd />
      </DropdownMenu>
    </div>
  );
}
