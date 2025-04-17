import { memo, useRef } from 'react';
import { IoAdd } from 'react-icons/io5';
import { Button } from '@chakra-ui/react';
import { MaybeString, SupportedEntry } from 'ontime-types';

import { useEntryActions } from '../../../common/hooks/useEntryAction';

import style from './QuickAddBlock.module.scss';

interface QuickAddBlockProps {
  previousEventId: MaybeString;
  parentBlock: MaybeString;
}

export default memo(QuickAddBlock);

function QuickAddBlock(props: QuickAddBlockProps) {
  const { previousEventId, parentBlock } = props;
  const { addEntry } = useEntryActions();

  const doLinkPrevious = useRef<HTMLInputElement | null>(null);
  const doPublic = useRef<HTMLInputElement | null>(null);

  const addEvent = () => {
    addEntry(
      {
        type: SupportedEntry.Event,
        parent: parentBlock ?? null,
      },
      {
        after: previousEventId,
        defaultPublic: doPublic?.current?.checked,
        lastEventId: previousEventId,
        linkPrevious: doLinkPrevious?.current?.checked,
      },
    );
  };

  const addDelay = () => {
    addEntry(
      // TODO(v4): add delays to blocks
      { type: SupportedEntry.Delay },
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
    <div className={style.quickAdd}>
      <Button
        onClick={addEvent}
        size='xs'
        variant='ontime-subtle-white'
        className={style.quickBtn}
        leftIcon={<IoAdd />}
        color='#b1b1b1' // $gray-400
      >
        Event
      </Button>
      <Button
        onClick={addDelay}
        size='xs'
        variant='ontime-subtle-white'
        className={style.quickBtn}
        leftIcon={<IoAdd />}
        color='#b1b1b1' // $gray-400
      >
        Delay
      </Button>
      {parentBlock === null && (
        <Button
          onClick={addBlock}
          size='xs'
          variant='ontime-subtle-white'
          className={style.quickBtn}
          leftIcon={<IoAdd />}
          color='#b1b1b1' // $gray-400
        >
          Block
        </Button>
      )}
    </div>
  );
}
