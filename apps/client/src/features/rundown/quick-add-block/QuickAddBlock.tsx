import { memo, useCallback, useRef } from 'react';
import { Button, Checkbox } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { SupportedEvent } from 'ontime-types';

import { useEventAction } from '../../../common/hooks/useEventAction';
import { useEditorSettings } from '../../../common/stores/editorSettings';
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

  const { defaultPublic, linkPrevious } = useEditorSettings((state) => state.eventSettings);

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

  const canLinkPrevious = Boolean(previousEventId);
  const shouldLinkPrevious = Boolean(linkPrevious) && canLinkPrevious;

  return (
    <div className={style.quickAdd}>
      <div className={style.btnRow}>
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
      <div className={style.options}>
        <Checkbox
          ref={doLinkPrevious}
          size='sm'
          variant='ontime-ondark'
          isDisabled={!canLinkPrevious}
          defaultChecked={shouldLinkPrevious}
        >
          Link to previous
        </Checkbox>
        <Checkbox ref={doPublic} size='sm' variant='ontime-ondark' defaultChecked={defaultPublic}>
          Event is public
        </Checkbox>
      </div>
    </div>
  );
}
