import { memo } from 'react';
import { Select, Switch } from '@chakra-ui/react';
import { EndAction, OntimeEvent, TimerType } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import TimeInputWithButton from '../../../../common/components/input/time-input/TimeInputWithButton';
import { useEventAction } from '../../../../common/hooks/useEventAction';
import { forgivingStringToMillis, millisToDelayString } from '../../../../common/utils/dateConfig';
import { cx } from '../../../../common/utils/styleUtils';

import style from '../EventEditor.module.scss';

interface EventEditorTimesProps {
  eventId: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  delay: number;
  isPublic: boolean;
  endAction: EndAction;
  timerType: TimerType;
  timeWarning: number;
  timeDanger: number;
}

type HandledActions = 'timerType' | 'endAction' | 'isPublic' | 'timeWarning' | 'timeDanger';
type TimeActions = 'timeStart' | 'timeEnd' | 'durationOverride'; // we call it durationOverride to stop from passing as a duration value

const EventEditorTimes = (props: EventEditorTimesProps) => {
  const { eventId, timeStart, timeEnd, duration, delay, isPublic, endAction, timerType, timeWarning, timeDanger } =
    props;
  const { updateEvent, updateTimer } = useEventAction();

  // In sync with EventBlockTimers
  const handleTimeSubmit = (field: TimeActions, value: string) => {
    if (field === 'timeStart' || field === 'timeEnd') {
      updateTimer(eventId, field, value);
      return;
    }

    if (field === 'durationOverride') {
      const timeInMillis = forgivingStringToMillis(value);
      const newEventData: Partial<OntimeEvent> = { id: eventId, timeEnd: timeStart + timeInMillis };
      updateEvent(newEventData);
      return;
    }
  };

  const handleSubmit = (field: HandledActions, value: string | boolean) => {
    if (field === 'isPublic') {
      updateEvent({ id: eventId, isPublic: !(value as boolean) });
      return;
    }

    if (field === 'timeWarning' || field === 'timeDanger') {
      const newTime = forgivingStringToMillis(value as string);
      updateEvent({ id: eventId, [field]: newTime });
      return;
    }

    if (field === 'timerType' || field === 'endAction') {
      updateEvent({ id: eventId, [field]: value });
      return;
    }
  };

  const hasDelay = delay !== 0;
  const delayTime = hasDelay ? millisToDelayString(delay) : null;
  const startLabel = delayTime ? `New Start ${millisToString(timeStart + delay)}` : 'Start time';
  const endLabel = delayTime ? `New End ${millisToString(timeEnd + delay)}` : 'End time';
  const inputTimeLabels = cx([style.inputLabel, hasDelay ? style.delayLabel : null]);

  return (
    <div className={style.column}>
      <div className={style.inline}>
        <div>
          <label className={inputTimeLabels} htmlFor='timeStart'>
            {startLabel}
          </label>
          <TimeInputWithButton
            name='timeStart'
            submitHandler={handleTimeSubmit}
            time={timeStart}
            hasDelay={hasDelay}
            placeholder='Start'
          />
        </div>
        <div>
          <label className={inputTimeLabels} htmlFor='timeEnd'>
            {endLabel}
          </label>
          <TimeInputWithButton
            name='timeEnd'
            submitHandler={handleTimeSubmit}
            time={timeEnd}
            hasDelay={hasDelay}
            placeholder='End'
          />
        </div>
        <div>
          <label className={style.inputLabel} htmlFor='durationOverride'>
            Duration
          </label>
          <TimeInputWithButton
            name='durationOverride'
            submitHandler={handleTimeSubmit}
            time={duration}
            placeholder='Duration'
          />
        </div>
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
          >
            <option value={TimerType.CountDown}>Count down</option>
            <option value={TimerType.CountUp}>Count up</option>
            <option value={TimerType.TimeToEnd}>Time to end</option>
            <option value={TimerType.Clock}>Clock</option>
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
          <Switch size='sm' isChecked={isPublic} onChange={() => handleSubmit('isPublic', isPublic)} variant='ontime' />
          {isPublic ? 'Public' : 'Private'}
        </label>
      </div>
    </div>
  );
};

export default memo(EventEditorTimes);
