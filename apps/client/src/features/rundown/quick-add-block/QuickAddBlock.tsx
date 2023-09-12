import { memo, useCallback, useRef } from 'react';
import { Button, Checkbox, Tooltip } from '@chakra-ui/react';
import { SupportedEvent } from 'ontime-types';

import { useEventAction } from '../../../common/hooks/useEventAction';
import { useEditorSettings } from '../../../common/stores/editorSettings';
import { useEmitLog } from '../../../common/stores/logger';
import { deviceAlt } from '../../../common/utils/deviceUtils';
import { tooltipDelayMid } from '../../../ontimeConfig';

import style from './QuickAddBlock.module.scss';

interface QuickAddBlockProps {
  showKbd: boolean;
  eventId: string;
  previousEventId?: string;
  disableAddDelay?: boolean;
  disableAddBlock: boolean;
}

const QuickAddBlock = (props: QuickAddBlockProps) => {
  const { showKbd, eventId, previousEventId, disableAddDelay = true, disableAddBlock } = props;
  const { addEvent } = useEventAction();
  const { emitError } = useEmitLog();

  const doStartTime = useRef<HTMLInputElement | null>(null);
  const doPublic = useRef<HTMLInputElement | null>(null);

  const eventSettings = useEditorSettings((state) => state.eventSettings);
  const defaultPublic = eventSettings.defaultPublic;
  const startTimeIsLastEnd = eventSettings.startTimeIsLastEnd;

  const handleCreateEvent = useCallback(
    (eventType: SupportedEvent) => {
      switch (eventType) {
        case 'event': {
          const isPublicOption = doPublic?.current?.checked;
          const startTimeIsLastEndOption = doStartTime?.current?.checked;

          const newEvent = { type: SupportedEvent.Event };
          const options = {
            defaultPublic: isPublicOption,
            startTimeIsLastEnd: startTimeIsLastEndOption,
            lastEventId: previousEventId,
            after: eventId,
          };
          addEvent(newEvent, options);
          break;
        }
        case 'delay': {
          const options = {
            lastEventId: previousEventId,
            after: eventId,
          };
          addEvent({ type: SupportedEvent.Delay }, options);
          break;
        }
        case 'block': {
          const options = {
            lastEventId: previousEventId,
            after: eventId,
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
    [previousEventId, eventId, addEvent, emitError],
  );

  return (
    <div className={style.quickAdd}>
      <div className={style.btnRow}>
        <Tooltip label='Add Event' openDelay={tooltipDelayMid}>
          <Button
            onClick={() => handleCreateEvent(SupportedEvent.Event)}
            size='xs'
            variant='ontime-subtle-white'
            className={style.quickBtn}
            data-testid='quick-add-event'
          >
            Event {showKbd && <span className={style.keyboard}>{`${deviceAlt} + E`}</span>}
          </Button>
        </Tooltip>
        <Tooltip label='Add Delay' openDelay={tooltipDelayMid}>
          <Button
            onClick={() => handleCreateEvent(SupportedEvent.Delay)}
            size='xs'
            variant='ontime-subtle-white'
            disabled={disableAddDelay}
            className={style.quickBtn}
            data-testid='quick-add-delay'
          >
            Delay {showKbd && <span className={style.keyboard}>{`${deviceAlt} + D`}</span>}
          </Button>
        </Tooltip>
        <Tooltip label='Add Block' openDelay={tooltipDelayMid}>
          <Button
            onClick={() => handleCreateEvent(SupportedEvent.Block)}
            size='xs'
            variant='ontime-subtle-white'
            disabled={disableAddBlock}
            className={style.quickBtn}
            data-testid='quick-add-block'
          >
            Block {showKbd && <span className={style.keyboard}>{`${deviceAlt} + B`}</span>}
          </Button>
        </Tooltip>
      </div>
      <div className={style.options}>
        <Checkbox ref={doStartTime} size='sm' variant='ontime-ondark' defaultChecked={startTimeIsLastEnd}>
          Start time is last end
        </Checkbox>
        <Checkbox ref={doPublic} size='sm' variant='ontime-ondark' defaultChecked={defaultPublic}>
          Event is public
        </Checkbox>
      </div>
    </div>
  );
};

export default memo(QuickAddBlock);
