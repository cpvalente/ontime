import { memo } from 'react';
import { Select, Switch } from '@chakra-ui/react';
import { EndAction, OntimeEvent, TimerType } from 'ontime-types';
import { calculateDuration, millisToString } from 'ontime-utils';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import TimeInputWithButton from '../../../../common/components/input/time-input/TimeInputWithButton';
import { useEventAction } from '../../../../common/hooks/useEventAction';
import { millisToDelayString } from '../../../../common/utils/dateConfig';
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

type TimeActions =
  | 'timeStart'
  | 'timeEnd'
  | 'durationOverride'
  | 'timerType'
  | 'endAction'
  | 'isPublic'
  | 'timeWarning'
  | 'timeDanger';

const EventEditorTimes = (props: EventEditorTimesProps) => {
  const { eventId, timeStart, timeEnd, duration, delay, isPublic, endAction, timerType, timeWarning, timeDanger } =
    props;
  const { updateEvent } = useEventAction();

  const handleSubmit = (field: TimeActions, value: number | string | boolean) => {
    const newEventData: Partial<OntimeEvent> = { id: eventId };
    switch (field) {
      case 'durationOverride': {
        // duration defines timeEnd
        newEventData.duration = value as number;
        newEventData.timeEnd = timeStart + (value as number);
        break;
      }
      case 'timeStart': {
        newEventData.duration = calculateDuration(value as number, timeEnd);
        newEventData.timeStart = value as number;
        break;
      }
      case 'timeEnd': {
        newEventData.duration = calculateDuration(timeStart, value as number);
        newEventData.timeEnd = value as number;
        break;
      }
      case 'isPublic': {
        updateEvent({ id: eventId, isPublic: !(value as boolean) });
        break;
      }
      default: {
        if (field === 'timerType' || field === 'endAction' || field === 'timeWarning' || field === 'timeDanger') {
          // @ts-expect-error -- not sure how to typecheck here
          newEventData[field as keyof OntimeEvent] = value as string;
        } else {
          return;
        }
      }
    }
    updateEvent(newEventData);
  };

  const delayTime = delay !== 0 ? millisToDelayString(delay) : null;
  const startLabel = delayTime ? `New start ${millisToString(timeStart + delay)}` : 'Start time';
  const endLabel = delayTime ? `New end ${millisToString(timeEnd + delay)}` : 'End time';
  const inputTimeLabels = cx([style.inputLabel, delayTime ? style.delayLabel : null]);

  return (
    <div className={style.column}>
      <div className={style.inline}>
        <div>
          <label className={inputTimeLabels} htmlFor='timeStart'>
            {startLabel}
          </label>
          <TimeInputWithButton
            id='timeStart'
            name='timeStart'
            submitHandler={handleSubmit}
            time={timeStart}
            delay={delay}
            placeholder='Start'
          />
        </div>
        <div>
          <label className={inputTimeLabels} htmlFor='timeEnd'>
            {endLabel}
          </label>
          <TimeInputWithButton
            id='timeEnd'
            name='timeEnd'
            submitHandler={handleSubmit}
            time={timeEnd}
            delay={delay}
            placeholder='End'
          />
        </div>
        <div>
          <label className={style.inputLabel} htmlFor='durationOverride'>
            Duration
          </label>
          <TimeInputWithButton
            id='durationOverride'
            name='durationOverride'
            submitHandler={handleSubmit}
            time={duration}
            placeholder='Duration'
          />
        </div>
      </div>

      <div className={style.splitTwo}>
        <label className={style.inputLabel} htmlFor='timeWarning'>
          Warning Time
          <TimeInput
            id='timeWarning'
            name='timeWarning'
            submitHandler={handleSubmit}
            time={timeWarning}
            placeholder='Duration'
          />
        </label>
        <label className={style.inputLabel}>
          Timer Type
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
        </label>
        <label className={style.inputLabel} htmlFor='timeDanger'>
          Danger Time
          <TimeInput
            id='timeDanger'
            name='timeDanger'
            submitHandler={handleSubmit}
            time={timeDanger}
            placeholder='Duration'
          />
        </label>
        <label className={style.inputLabel}>
          End Action
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
        </label>
      </div>

      <div>
        <span className={style.inputLabel}>Event visibility</span>
        <label className={style.switchLabel}>
          <Switch isChecked={isPublic} onChange={() => handleSubmit('isPublic', isPublic)} variant='ontime' />
          {isPublic ? 'Public' : 'Private'}
        </label>
      </div>
    </div>
  );
};

export default memo(EventEditorTimes);
