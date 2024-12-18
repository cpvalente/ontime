import { memo } from 'react';
import { EndAction, MaybeString, TimerType, TimeStrategy } from 'ontime-types';
import { millisToString, parseUserTime } from 'ontime-utils';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { useEventAction } from '../../../../common/hooks/useEventAction';
import { millisToDelayString } from '../../../../common/utils/dateConfig';
import { SelectItem, SelectRoot } from '../../../../components/ui/select';
import { Switch } from '../../../../components/ui/switch';
import * as Editor from '../../../editors/editor-utils/EditorUtils';
import TimeInputFlow from '../../time-input-flow/TimeInputFlow';

import style from '../EventEditor.module.scss';

interface EventEditorTimesProps {
  eventId: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  timeStrategy: TimeStrategy;
  linkStart: MaybeString;
  isTimeToEnd: boolean;
  delay: number;
  isPublic: boolean;
  endAction: EndAction;
  timerType: TimerType;
  timeWarning: number;
  timeDanger: number;
}

type HandledActions = 'isTimeToEnd' | 'timerType' | 'endAction' | 'isPublic' | 'timeWarning' | 'timeDanger';

function EventEditorTimes(props: EventEditorTimesProps) {
  const {
    eventId,
    timeStart,
    timeEnd,
    duration,
    timeStrategy,
    linkStart,
    isTimeToEnd,
    delay,
    isPublic,
    endAction,
    timerType,
    timeWarning,
    timeDanger,
  } = props;
  const { updateEvent } = useEventAction();

  const handleSubmit = (field: HandledActions, value: string | boolean) => {
    if (field === 'isPublic') {
      updateEvent({ id: eventId, isPublic: !(value as boolean) });
      return;
    }

    if (field === 'isTimeToEnd') {
      updateEvent({ id: eventId, isTimeToEnd: !(value as boolean) });
      return;
    }

    if (field === 'timeWarning' || field === 'timeDanger') {
      const newTime = parseUserTime(value as string);
      updateEvent({ id: eventId, [field]: newTime });
      return;
    }

    if (field === 'timerType' || field === 'endAction') {
      updateEvent({ id: eventId, [field]: value });
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
        <div>
          <Editor.Label>Event schedule</Editor.Label>
          <div className={style.inline}>
            <TimeInputFlow
              eventId={eventId}
              timeStart={timeStart}
              timeEnd={timeEnd}
              duration={duration}
              timeStrategy={timeStrategy}
              linkStart={linkStart}
              delay={delay}
              isTimeToEnd={isTimeToEnd}
            />
          </div>
          <div className={style.delayLabel}>{delayLabel}</div>
        </div>

        <Editor.Title>Event behaviour</Editor.Title>
        <div className={style.splitTwo}>
          <div>
            <Editor.Label htmlFor='endAction'>End Action</Editor.Label>
            <SelectRoot
              id='endAction'
              size='sm'
              name='endAction'
              value={[endAction]}
              onChange={(event) => handleSubmit('timerType', event.currentTarget.value)}
              variant='ontime'
            >
              <SelectItem item={EndAction.None}>None</SelectItem>
              <SelectItem item={EndAction.Stop}>Stop rundown</SelectItem>
              <SelectItem item={EndAction.LoadNext}>Load next event</SelectItem>
              <SelectItem item={EndAction.PlayNext}>Play next event</SelectItem>
            </SelectRoot>
          </div>
          <div>
            <Editor.Label htmlFor='timeToEnd'>Target Event Scheduled End</Editor.Label>
            <Editor.Label className={style.switchLabel}>
              <Switch
                id='timeToEnd'
                size='md'
                isChecked={isTimeToEnd}
                onChange={() => handleSubmit('isTimeToEnd', isTimeToEnd)}
                variant='ontime'
              />
              {isTimeToEnd ? 'On' : 'Off'}
            </Editor.Label>
          </div>
        </div>
      </div>
      <div className={style.column}>
        <Editor.Title>Display options</Editor.Title>
        <div className={style.splitTwo}>
          <div>
            <Editor.Label htmlFor='timerType'>Timer Type</Editor.Label>
            <SelectRoot
              size='sm'
              id='timerType'
              name='timerType'
              value={[timerType]}
              onChange={(event) => handleSubmit('timerType', event.currentTarget.value)}
              variant='ontime'
            >
              <SelectItem item={TimerType.CountDown}>Count down</SelectItem>
              <SelectItem item={TimerType.CountUp}>Count up</SelectItem>
              <SelectItem item={TimerType.Clock}>Clock</SelectItem>
              <SelectItem item={TimerType.None}>None</SelectItem>
            </SelectRoot>
          </div>
          <div>
            <Editor.Label htmlFor='timeWarning'>Warning Time</Editor.Label>
            <TimeInput
              id='timeWarning'
              name='timeWarning'
              submitHandler={handleSubmit}
              time={timeWarning}
              placeholder='Duration'
            />
          </div>

          <div>
            <Editor.Label htmlFor='isPublic'>Event Visibility</Editor.Label>
            <Editor.Label className={style.switchLabel}>
              <Switch
                id='isPublic'
                size='md'
                isChecked={isPublic}
                onChange={() => handleSubmit('isPublic', isPublic)}
                variant='ontime'
              />
              {isPublic ? 'Public' : 'Private'}
            </Editor.Label>
          </div>
          <div>
            <Editor.Label htmlFor='timeDanger'>Danger Time</Editor.Label>
            <TimeInput
              id='timeDanger'
              name='timeDanger'
              submitHandler={handleSubmit}
              time={timeDanger}
              placeholder='Duration'
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default memo(EventEditorTimes);
