import { useCallback, useContext, useEffect, useState } from 'react';
import { Checkbox, Tooltip } from '@chakra-ui/react';
import { defaultPublicAtom, startTimeIsLastEndAtom } from 'common/atoms/LocalEventSettings';
import { LoggingContext } from 'common/context/LoggingContext';
import { useEventAction } from 'common/hooks/useEventAction';
import { EventTypes } from 'common/models/EventTypes';
import { useAtomValue } from 'jotai';

import { tooltipDelayMid } from '../../../ontimeConfig';

import style from './EntryBlock.module.scss';

interface EntryBlockProps {
  showKbd: boolean;
  previousId?: string;
  previousEventId: string | null;
  visible?: boolean;
  disableAddDelay?: boolean;
  disableAddBlock: boolean;
}

export default function EntryBlock(props: EntryBlockProps) {
  const {
    showKbd,
    previousId,
    previousEventId,
    visible = true,
    disableAddDelay = true,
    disableAddBlock,
  } = props;
  const { addEvent } = useEventAction();
  const { emitError } = useContext(LoggingContext);
  const startTimeIsLastEnd = useAtomValue(startTimeIsLastEndAtom);
  const defaultPublic = useAtomValue(defaultPublicAtom);
  const [doStartTime, setStartTime] = useState(startTimeIsLastEnd);
  const [doPublic, setPublic] = useState(defaultPublic);

  const handleCreateEvent = useCallback((eventType: EventTypes) => {
    switch (eventType) {
      case 'event': {
        const newEvent = { type: 'event', after: previousId, isPublic: doPublic };
        const options = { startIsLastEnd: doStartTime ? previousEventId : undefined };
        addEvent(newEvent, options);
        break;
      }
      case 'delay': {
        addEvent({ type: 'delay', after: previousId });
        break;
      }
      case 'block': {
        addEvent({ type: 'block', after: previousId });
        break;
      }
      default: {
        emitError(`Cannot create unknown event type: ${eventType}`);
        break;
      }
    }

  }, [addEvent, doPublic, doStartTime, emitError, previousId, previousEventId]);

  useEffect(() => {
    setStartTime(startTimeIsLastEnd);
  }, [startTimeIsLastEnd]);

  useEffect(() => {
    setPublic(defaultPublic);
  }, [defaultPublic]);

  return (
    <div className={`${style.create} ${visible ? style.visible : ''}`}>
      <Tooltip label='Add Event' openDelay={tooltipDelayMid}>
        <span
          className={style.createEvent}
          onClick={() => handleCreateEvent('event')}
          role='button'
        >
          E{showKbd && <span className={style.keyboard}>Alt + E</span>}
        </span>
      </Tooltip>
      <Tooltip label='Add Delay' openDelay={tooltipDelayMid}>
        <span
          className={`${style.createDelay} ${disableAddDelay ? style.disabled : ''}`}
          onClick={() => handleCreateEvent('delay')}
          role='button'
        >
          D{showKbd && <span className={style.keyboard}>Alt + D</span>}
        </span>
      </Tooltip>
      <Tooltip label='Add Block' openDelay={tooltipDelayMid}>
        <span
          className={`${style.createBlock} ${disableAddBlock ? style.disabled : ''}`}
          onClick={() => handleCreateEvent('block')}
          role='button'
        >
          B{showKbd && <span className={style.keyboard}>Alt + B</span>}
        </span>
      </Tooltip>
      <div className={style.options}>
        <Checkbox
          size='sm'
          colorScheme='blue'
          isChecked={doStartTime}
          onChange={(e) => setStartTime(e.target.checked)}
        >
          Start time is last end
        </Checkbox>
        <Checkbox
          size='sm'
          colorScheme='blue'
          isChecked={doPublic}
          onChange={(e) => setPublic(e.target.checked)}
        >
          Event is public
        </Checkbox>
      </div>
    </div>
  );
}
