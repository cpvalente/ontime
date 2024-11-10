import { memo } from 'react';
import { Select, Switch } from '@chakra-ui/react';
import { EndAction, MaybeString, TimerType, TimeStrategy } from 'ontime-types';
import { millisToString, parseUserTime } from 'ontime-utils';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { useEventAction } from '../../../../common/hooks/useEventAction';
import { millisToDelayString } from '../../../../common/utils/dateConfig';
import TimeInputFlow from '../../time-input-flow/TimeInputFlow';

import style from '../EventEditor.module.scss';

interface EventEditorTimesProps {
  eventId: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  timeStrategy: TimeStrategy;
  linkStart: MaybeString;
  delay: number;
  isPublic: boolean;
  endAction: EndAction;
  timerType: TimerType;
  timeWarning: number;
  timeDanger: number;
  frozen: boolean;
}

type HandledActions = 'timerType' | 'endAction' | 'isPublic' | 'timeWarning' | 'timeDanger';

const EventEditorTimes = (props: EventEditorTimesProps) => {
  const {
    eventId,
    timeStart,
    timeEnd,
    duration,
    timeStrategy,
    linkStart,
    delay,
    isPublic,
    endAction,
    timerType,
    timeWarning,
    timeDanger,
    frozen,
  } = props;
  const { updateEvent } = useEventAction();

  const handleSubmit = (field: HandledActions, value: string | boolean) => {
    if (field === 'isPublic') {
      updateEvent({ id: eventId, isPublic: !(value as boolean) });
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
    <div className={style.column}>
      <div>
        <div className={style.inputLabel}>Event schedule</div>
        <div className={style.inline}>
          <TimeInputFlow
            eventId={eventId}
            timeStart={timeStart}
            timeEnd={timeEnd}
            duration={duration}
            timeStrategy={timeStrategy}
            linkStart={linkStart}
            delay={delay}
            timerType={timerType}
          />
        </div>
        <div className={style.delayLabel}>{delayLabel}</div>
      </div>

      <div className={style.splitTwo}>
        <div>
          <label className={style.inputLabel} htmlFor='timeWarning'>
            Warning Time
          </label>
          <TimeInput name='timeWarning' submitHandler={handleSubmit} time={timeWarning} placeholder='Duration' />
        </div>
        <div>
          <label className={style.inputLabel}>Timer Type</label>
          <Select
            size='sm'
            name='timerType'
            value={timerType}
            onChange={(event) => handleSubmit('timerType', event.target.value)}
            variant='ontime'
            disabled={frozen}
          >
            <option value={TimerType.CountDown}>Count down</option>
            <option value={TimerType.CountUp}>Count up</option>
            <option value={TimerType.TimeToEnd}>Time to end</option>
            <option value={TimerType.Clock}>Clock</option>
            <option value={TimerType.None}>None</option>
          </Select>
        </div>
        <div>
          <label className={style.inputLabel} htmlFor='timeDanger'>
            Danger Time
          </label>
          <TimeInput name='timeDanger' submitHandler={handleSubmit} time={timeDanger} placeholder='Duration' />
        </div>
        <div>
          <label className={style.inputLabel}>End Action</label>
          <Select
            size='sm'
            name='endAction'
            value={endAction}
            onChange={(event) => handleSubmit('endAction', event.target.value)}
            variant='ontime'
            disabled={frozen}
          >
            <option value={EndAction.None}>None</option>
            <option value={EndAction.Stop}>Stop</option>
            <option value={EndAction.LoadNext}>Load Next</option>
            <option value={EndAction.PlayNext}>Play Next</option>
          </Select>
        </div>
      </div>

      <div>
        <span className={style.inputLabel}>Event Visibility</span>
        <label className={style.switchLabel}>
          <Switch
            size='md'
            isChecked={isPublic}
            onChange={() => handleSubmit('isPublic', isPublic)}
            variant='ontime'
            disabled={frozen}
          />
          {isPublic ? 'Public' : 'Private'}
        </label>
      </div>
    </div>
  );
};

export default memo(EventEditorTimes);
