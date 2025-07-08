import { memo } from 'react';
import { IoAdd } from 'react-icons/io5';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { MaybeString, SupportedEntry } from 'ontime-types';

import Button from '../../../../common/components/buttons/Button';
import { useEntryActions } from '../../../../common/hooks/useEntryAction';
import { cx } from '../../../../common/utils/styleUtils';

import style from './QuickAddButtons.module.scss';

interface QuickAddButtonsProps {
  previousEventId: MaybeString;
  parentBlock: MaybeString;
  backgroundColor?: string;
}

export default memo(QuickAddButtons);
function QuickAddButtons({ previousEventId, parentBlock, backgroundColor }: QuickAddButtonsProps) {
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

  /**
   * If the colour is empty string ''
   * ie: we are inside a block, but there is no defined colour
   * we default to $gray-500 #9d9d9d
   */
  const blockColour = backgroundColor === '' ? '#9d9d9d' : backgroundColor;

  return (
    <Toolbar.Root
      className={cx([style.quickAdd, Boolean(parentBlock) && style.indent])}
      style={blockColour ? { '--user-bg': blockColour } : {}}
      data-testid='quick-add-buttons'
    >
      <Toolbar.Button render={<Button size='small' />} onClick={addEvent}>
        <IoAdd />
        Event
      </Toolbar.Button>

      <Toolbar.Button render={<Button size='small' />} onClick={addDelay}>
        <IoAdd />
        Delay
      </Toolbar.Button>

      <Toolbar.Button render={<Button size='small' />} onClick={addMilestone}>
        <IoAdd />
        Milestone
      </Toolbar.Button>

      {parentBlock === null && (
        <Toolbar.Button render={<Button size='small' />} onClick={addBlock}>
          <IoAdd />
          Group
        </Toolbar.Button>
      )}
    </Toolbar.Root>
  );
}
