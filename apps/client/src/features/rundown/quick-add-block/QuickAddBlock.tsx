import { memo, useCallback, useRef } from 'react';
import { Button } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { SupportedEvent } from 'ontime-types';

import { useEventAction } from '../../../common/hooks/useEventAction';
import { useEmitLog } from '../../../common/stores/logger';

import style from './QuickAddBlock.module.scss';

interface QuickAddBlockProps {
  previousEventId?: string;
}

export default memo(QuickAddBlock);

function QuickAddBlock(props: QuickAddBlockProps) {
  const { previousEventId } = props;
  const { addEvent } = useEventAction();
  const { emitError } = useEmitLog();

  const doLinkPrevious = useRef<HTMLInputElement | null>(null);
  const doPublic = useRef<HTMLInputElement | null>(null);

  const handleCreateEvent = useCallback(
    (eventType: SupportedEvent) => {
      switch (eventType) {
        case 'event': {
          const defaultPublic = doPublic?.current?.checked;
          const linkPrevious = doLinkPrevious?.current?.checked;

          const newEvent = { type: SupportedEvent.Event };
          const options = {
            after: previousEventId,
            defaultPublic,
            lastEventId: previousEventId,
            linkPrevious,
          };
          addEvent(newEvent, options);
          break;
        }
        case 'delay': {
          const options = {
            lastEventId: previousEventId,
            after: previousEventId,
          };
          addEvent({ type: SupportedEvent.Delay }, options);
          break;
        }
        case 'block': {
          const options = {
            lastEventId: previousEventId,
            after: previousEventId,
          };
          addEvent({ type: SupportedEvent.Block }, options);
          break;
        }
        default: {
          emitError(`Cannot create unknown event type: ${eventType}`);
          break;
        }
      }
    },
    [previousEventId, addEvent, emitError],
  );

  return (
    <div className={style.quickAdd}>
      <Button
        onClick={() => handleCreateEvent(SupportedEvent.Event)}
        size='xs'
        variant='ontime-subtle-white'
        className={style.quickBtn}
        leftIcon={<IoAdd />}
      >
        Event
      </Button>
      <Button
        onClick={() => handleCreateEvent(SupportedEvent.Delay)}
        size='xs'
        variant='ontime-subtle-white'
        className={style.quickBtn}
        leftIcon={<IoAdd />}
      >
        Delay
      </Button>
      <Button
        onClick={() => handleCreateEvent(SupportedEvent.Block)}
        size='xs'
        variant='ontime-subtle-white'
        className={style.quickBtn}
        leftIcon={<IoAdd />}
      >
        Block
      </Button>
    </div>
  );
}
