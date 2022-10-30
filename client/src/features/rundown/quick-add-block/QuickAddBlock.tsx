import { useCallback, useContext, useRef } from 'react';
import { Checkbox, Tooltip } from '@chakra-ui/react';
import { defaultPublicAtom, startTimeIsLastEndAtom } from 'common/atoms/LocalEventSettings';
import { LoggingContext } from 'common/context/LoggingContext';
import { useEventAction } from 'common/hooks/useEventAction';
import { EventTypes } from 'common/models/EventTypes';
import { useAtomValue } from 'jotai';

import { tooltipDelayMid } from '../../../ontimeConfig';

import style from './QuickAddBlock.module.scss';

interface QuickAddBlockProps {
  showKbd: boolean;
  previousId?: string;
  previousEventId: string | null;
  disableAddDelay?: boolean;
  disableAddBlock: boolean;
}

export default function QuickAddBlock(props: QuickAddBlockProps) {
  const {
    showKbd,
    previousId,
    previousEventId,
    disableAddDelay = true,
    disableAddBlock,
  } = props;
  const { addEvent } = useEventAction();
  const { emitError } = useContext(LoggingContext);
  const startTimeIsLastEnd = useAtomValue(startTimeIsLastEndAtom);
  const defaultPublic = useAtomValue(defaultPublicAtom);
  const doStartTime = useRef<HTMLInputElement | null>(null);
  const doPublic = useRef<HTMLInputElement | null>(null)

  const handleCreateEvent = useCallback((eventType: EventTypes) => {
    switch (eventType) {
      case 'event': {
        const isPublicOption = doPublic?.current?.checked || defaultPublic;
        const startTimeIsLastEndOption = doStartTime?.current?.checked || doStartTime;

        const newEvent = { type: 'event', after: previousId, isPublic: isPublicOption };
        const options = { startIsLastEnd: startTimeIsLastEndOption ? previousEventId : undefined };
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

  return (
    <div className={style.quickAdd}>
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
          ref={doStartTime}
          size='sm'
          colorScheme='blue'
          defaultChecked={startTimeIsLastEnd}
        >
          Start time is last end
        </Checkbox>
        <Checkbox
          ref={doPublic}
          size='sm'
          colorScheme='blue'
          defaultChecked={defaultPublic}
        >
          Event is public
        </Checkbox>
      </div>
    </div>
  );
}
