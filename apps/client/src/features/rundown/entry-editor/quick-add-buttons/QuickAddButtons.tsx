import { Toolbar } from '@base-ui/react/toolbar';
import { MaybeString, SupportedEntry } from 'ontime-types';
import { memo } from 'react';
import { IoAdd } from 'react-icons/io5';

import Button from '../../../../common/components/buttons/Button';
import { useEntryActionsContext } from '../../../../common/context/EntryActionsContext';
import { cx } from '../../../../common/utils/styleUtils';

import style from './QuickAddButtons.module.scss';

interface QuickAddButtonsProps {
  previousEventId: MaybeString;
  nextEventId?: MaybeString;
  parentGroup: MaybeString;
  backgroundColor?: string;
}

export default memo(QuickAddButtons);
function QuickAddButtons({ previousEventId, nextEventId, parentGroup, backgroundColor }: QuickAddButtonsProps) {
  const { addEntry } = useEntryActionsContext();
  const appendOptions = previousEventId ? { after: previousEventId, lastEventId: previousEventId } : undefined;
  const prependOptions = nextEventId ? { before: nextEventId } : undefined;
  const insertionOptions = appendOptions ?? prependOptions;

  const addEvent = () => {
    addEntry(
      {
        type: SupportedEntry.Event,
        parent: parentGroup,
      },
      insertionOptions,
    );
  };

  const addDelay = () => {
    addEntry({ type: SupportedEntry.Delay, parent: parentGroup }, insertionOptions);
  };

  const addMilestone = () => {
    addEntry({ type: SupportedEntry.Milestone, parent: parentGroup }, insertionOptions);
  };

  const addGroup = () => {
    if (parentGroup !== null) {
      return;
    }
    addEntry({ type: SupportedEntry.Group }, insertionOptions);
  };

  /**
   * If the colour is empty string ''
   * ie: we are inside a group, but there is no defined colour
   * we default to $gray-500 #9d9d9d
   */
  const groupColour = backgroundColor === '' ? '#9d9d9d' : backgroundColor;

  return (
    <Toolbar.Root
      className={cx([style.quickAdd, Boolean(parentGroup) && style.indent])}
      style={groupColour ? { '--user-bg': groupColour } : {}}
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

      {parentGroup === null && (
        <Toolbar.Button render={<Button size='small' />} onClick={addGroup}>
          <IoAdd />
          Group
        </Toolbar.Button>
      )}
    </Toolbar.Root>
  );
}
