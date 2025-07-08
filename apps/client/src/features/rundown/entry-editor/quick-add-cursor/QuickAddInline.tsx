import { memo } from 'react';
import { IoAdd } from 'react-icons/io5';
import { MaybeString, SupportedEntry } from 'ontime-types';

import IconButton from '../../../../common/components/buttons/IconButton';
import { DropdownMenu } from '../../../../common/components/dropdown-menu/DropdownMenu';
import { useEntryActions } from '../../../../common/hooks/useEntryAction';

import style from './QuickAddInline.module.scss';

interface QuickAddInlineProps {
  previousEventId: MaybeString;
  parentBlock: MaybeString;
}

export default memo(QuickAddInline);
function QuickAddInline({ previousEventId, parentBlock }: QuickAddInlineProps) {
  const { addEntry } = useEntryActions();

  const addEvent = () => {
    addEntry(
      {
        type: SupportedEntry.Event,
        parent: parentBlock,
      },
      {
        after: previousEventId,
        lastEventId: previousEventId,
      },
    );
  };

  const addDelay = () => {
    addEntry(
      { type: SupportedEntry.Delay, parent: parentBlock },
      {
        lastEventId: previousEventId,
        after: previousEventId,
      },
    );
  };

  const addMilestone = () => {
    addEntry(
      { type: SupportedEntry.Milestone, parent: parentBlock },
      {
        lastEventId: previousEventId,
        after: previousEventId,
      },
    );
  };

  const addBlock = () => {
    if (parentBlock !== null) {
      return;
    }
    addEntry(
      { type: SupportedEntry.Block },
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
          { type: 'item', icon: <IoAdd />, label: 'Add Event', onClick: addEvent },
          { type: 'item', icon: <IoAdd />, label: 'Add Delay', onClick: addDelay },
          { type: 'item', icon: <IoAdd />, label: 'Add Milestone', onClick: addMilestone },
          { type: 'item', icon: <IoAdd />, label: 'Add Group', onClick: addBlock, disabled: parentBlock !== null },
        ]}
        render={<IconButton size='small' variant='primary' className={style.addButton} />}
      >
        <IoAdd />
      </DropdownMenu>
    </div>
  );
}
