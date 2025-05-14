import { memo } from 'react';
import { Select, Switch } from '@chakra-ui/react';
import { EndAction, MaybeString, TimeStrategy } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import { useEventAction } from '../../../../common/hooks/useEventAction';
import { millisToDelayString } from '../../../../common/utils/dateConfig';
import * as Editor from '../../../editors/editor-utils/EditorUtils';
import TimeInputFlow from '../../time-input-flow/TimeInputFlow';

import style from '../EventEditor.module.scss';

interface MobileEventEditorTimesProps {
  eventId: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  timeStrategy: TimeStrategy;
  linkStart: MaybeString;
  countToEnd: boolean;
  delay: number;
  endAction: EndAction;
}

type HandledActions = 'countToEnd' | 'endAction';

function MobileEventEditorTimes(props: MobileEventEditorTimesProps) {
  const {
    eventId,
    timeStart,
    timeEnd,
    duration,
    timeStrategy,
    linkStart,
    countToEnd,
    delay,
    endAction,
  } = props;
  const { updateEvent } = useEventAction();

  const handleSubmit = (field: HandledActions, value: string | boolean) => {
    if (field === 'countToEnd') {
      updateEvent({ id: eventId, countToEnd: !(value as boolean) });
      return;
    }

    if (field === 'endAction') {
      updateEvent({ id: eventId, endAction: value as EndAction });
      return;
    }
  };

  const hasDelay = delay !== 0;
  const delayLabel = hasDelay
    ? `Event is ${millisToDelayString(delay, 'expanded')}. New schedule ${millisToString(
        timeStart + delay,
      )} → ${millisToString(timeEnd + delay)}`
    : '';

  return (
    <>
      <div className={style.column}>
        <Editor.Title>Event schedule</Editor.Title>
        <div>
          <div className={style.inline}>
            <TimeInputFlow
              eventId={eventId}
              timeStart={timeStart}
              timeEnd={timeEnd}
              duration={duration}
              timeStrategy={timeStrategy}
              linkStart={linkStart}
              delay={delay}
              countToEnd={countToEnd}
              showLabels
            />
          </div>
          <div className={style.delayLabel}>{delayLabel}</div>
        </div>
      </div>

      <div className={style.column}>
        <Editor.Title>Event Behaviour</Editor.Title>
        <div className={style.splitTwo}>
          <div>
            <Editor.Label htmlFor='endAction'>End Action</Editor.Label>
            <Select
              id='endAction'
              size='sm'
              name='endAction'
              value={endAction}
              onChange={(event) => handleSubmit('endAction', event.target.value)}
              variant='ontime'
            >
              <option value={EndAction.None}>None</option>
              <option value={EndAction.Stop}>Stop rundown</option>
              <option value={EndAction.LoadNext}>Load next event</option>
              <option value={EndAction.PlayNext}>Play next event</option>
            </Select>
          </div>
          <div>
            <Editor.Label htmlFor='countToEnd'>Count to End</Editor.Label>
            <Editor.Label className={style.switchLabel}>
              <Switch
                id='countToEnd'
                size='md'
                isChecked={countToEnd}
                onChange={() => handleSubmit('countToEnd', countToEnd)}
                variant='ontime'
              />
              {countToEnd ? 'On' : 'Off'}
            </Editor.Label>
          </div>
        </div>
      </div>
    </>
  );
}

export default memo(MobileEventEditorTimes);
