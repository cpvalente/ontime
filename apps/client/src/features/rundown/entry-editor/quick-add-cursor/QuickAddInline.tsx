import { memo } from 'react';
import { IoAdd } from 'react-icons/io5';
import { MaybeString, SupportedEntry } from 'ontime-types';

import IconButton from '../../../../common/components/buttons/IconButton';
import { DropdownMenu } from '../../../../common/components/dropdown-menu/DropdownMenu';
import { useEntryActions } from '../../../../common/hooks/useEntryAction';

import style from './QuickAddInline.module.scss';

interface QuickAddInlineProps {
  previousEventId: MaybeString;
  parentGroup: MaybeString;
}

export default memo(QuickAddInline);
function QuickAddInline({ previousEventId, parentGroup }: QuickAddInlineProps) {
  const { addEntry } = useEntryActions();

  const addEvent = () => {
    addEntry(
      {
        type: SupportedEntry.Event,
        parent: parentGroup,
      },
      {
        after: previousEventId,
        lastEventId: previousEventId,
      },
    );
  };

  const addDelay = () => {
    addEntry(
      { type: SupportedEntry.Delay, parent: parentGroup },
      {
        lastEventId: previousEventId,
        after: previousEventId,
      },
    );
  };

  const addMilestone = () => {
    addEntry(
      { type: SupportedEntry.Milestone, parent: parentGroup },
      {
        lastEventId: previousEventId,
        after: previousEventId,
      },
    );
  };

  const addGroup = () => {
    if (parentGroup !== null) {
      return;
    }
    addEntry(
      { type: SupportedEntry.Group },
      {
        lastEventId: previousEventId,
        after: previousEventId,
      },
    );
  };

  return (
    <div className={style.quickAdd} data-testid='quick-add-inline'>
      <DropdownMenu
        items={[
          { type: 'item', icon: IoAdd, label: 'Add Event', onClick: addEvent },
          { type: 'item', icon: IoAdd, label: 'Add Delay', onClick: addDelay },
          { type: 'item', icon: IoAdd, label: 'Add Milestone', onClick: addMilestone },
          { type: 'item', icon: IoAdd, label: 'Add Group', onClick: addGroup, disabled: parentGroup !== null },
        ]}
        render={<IconButton size='small' variant='primary' className={style.addButton} />}
      >
        <IoAdd />
      </DropdownMenu>
    </div>
  );
}
