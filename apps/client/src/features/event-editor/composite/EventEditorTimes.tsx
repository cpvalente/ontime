import { memo, useState } from 'react';
import { Select, Switch } from '@chakra-ui/react';
import { EndAction, OntimeEvent, TimerType } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import TimeInput from '../../../common/components/input/time-input/TimeInput';
import { useEventAction } from '../../../common/hooks/useEventAction';
import { millisToDelayString } from '../../../common/utils/dateConfig';
import { cx } from '../../../common/utils/styleUtils';
import { calculateDuration, TimeEntryField, validateEntry } from '../../../common/utils/timesManager';

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
}

type TimeActions = 'timeStart' | 'timeEnd' | 'durationOverride' | 'timerType' | 'endAction' | 'isPublic';

// Todo: add previous end to TimeInput fields
const EventEditorTimes = (props: EventEditorTimesProps) => {
  const { eventId, timeStart, timeEnd, duration, delay, isPublic, endAction, timerType } = props;
  const { updateEvent } = useEventAction();

  const [warning, setWarnings] = useState({ start: '', end: '', duration: '' });

  const timerValidationHandler = (entry: TimeEntryField, val: number) => {
    const valid = validateEntry(entry, val, timeStart, timeEnd);
    setWarnings((prev) => ({ ...prev, ...valid.warnings }));
    return valid.value;
  };

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
        if (field === 'timerType' || field === 'endAction') {
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
    <div className={style.timeOptions}>
      <div className={style.timers}>
        <label className={inputTimeLabels}>{startLabel}</label>
        <TimeInput
          name='timeStart'
          submitHandler={handleSubmit}
          validationHandler={timerValidationHandler}
          time={timeStart}
          delay={delay}
          placeholder='Start'
          warning={warning.start}
        />
        <label className={inputTimeLabels}>{endLabel}</label>
        <TimeInput
          name='timeEnd'
          submitHandler={handleSubmit}
          validationHandler={timerValidationHandler}
          time={timeEnd}
          delay={delay}
          placeholder='End'
          warning={warning.end}
        />
        <label className={style.inputLabel}>Duration</label>
        <TimeInput
          name='durationOverride'
          submitHandler={handleSubmit}
          validationHandler={timerValidationHandler}
          time={duration}
          placeholder='Duration'
          warning={warning.duration}
        />
      </div>
      <div className={style.timeSettings}>
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
          <option value={TimerType.Clock}>Clock</option>
        </Select>
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
        <span className={style.spacer} />
        <label className={`${style.inputLabel} ${style.publicToggle}`}>
          <Switch isChecked={isPublic} onChange={() => handleSubmit('isPublic', isPublic)} variant='ontime' />
          Event is public
        </label>
      </div>
    </div>
  );
};

export default memo(EventEditorTimes);
