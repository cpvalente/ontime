import { memo, useRef } from 'react';
import { IoAdd } from 'react-icons/io5';
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
   * we default to $gray-1050 #303030
   */
  const blockColour = backgroundColor === '' ? '#303030' : backgroundColor;

  return (
    <div className={style.quickAdd} style={blockColour ? { '--user-bg': blockColour } : {}}>
      <Button onClick={addEvent} size='small' variant='subtle-white'>
        <IoAdd />
        Event
      </Button>
      <Button onClick={addDelay} size='small' variant='subtle-white'>
        <IoAdd />
        Delay
      </Button>
      {parentBlock === null && (
        <Button onClick={addBlock} size='small' variant='subtle-white'>
          <IoAdd />
          Block
        </Button>
      )}
    </div>
  );
}
