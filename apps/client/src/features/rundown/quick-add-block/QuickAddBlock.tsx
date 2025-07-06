import { memo, useRef } from 'react';
import { IoAdd } from 'react-icons/io5';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { MaybeString, SupportedEntry } from 'ontime-types';

import Button from '../../../common/components/buttons/Button';
import { useEntryActions } from '../../../common/hooks/useEntryAction';

import style from './QuickAddBlock.module.scss';

interface QuickAddBlockProps {
  previousEventId: MaybeString;
  parentBlock: MaybeString;
  backgroundColor?: string;
}

export default memo(QuickAddBlock);
function QuickAddBlock({ previousEventId, parentBlock, backgroundColor }: QuickAddBlockProps) {
  const { addEntry } = useEntryActions();

  const doLinkPrevious = useRef<HTMLInputElement | null>(null);

  const addEvent = () => {
    addEntry(
      {
        type: SupportedEntry.Event,
        parent: parentBlock,
      },
      {
        after: previousEventId,
        lastEventId: previousEventId,
        linkPrevious: doLinkPrevious?.current?.checked,
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
    <Toolbar.Root className={style.quickAdd} style={blockColour ? { '--user-bg': blockColour } : {}}>
      <Toolbar.Button render={<Button size='small' variant='subtle-white' />} onClick={addEvent}>
        <IoAdd />
        Event
      </Toolbar.Button>

      <Toolbar.Button render={<Button size='small' variant='subtle-white' />} onClick={addDelay}>
        <IoAdd />
        Delay
      </Toolbar.Button>

      {parentBlock === null && (
        <Toolbar.Button render={<Button size='small' variant='subtle-white' />} onClick={addBlock}>
          <IoAdd />
          Block
        </Toolbar.Button>
      )}
    </Toolbar.Root>
  );
}
