import { useCallback, useState } from 'react';
import { millisToString } from 'ontime-utils';

import TimeInput from '../../../../common/components/input/time-input/TimeInput';
import { millisToMinutes } from '../../../../common/utils/dateConfig';
import { TimeEntryField, validateEntry } from '../../../../common/utils/timesManager';
import { EventItemActions } from '../../RundownEntry';

import style from '../EventBlock.module.scss';

interface EventBlockTimerProps {
  timeStart: number;
  timeEnd: number;
  duration: number;
  delay: number;
  actionHandler: (action: EventItemActions, payload?: any) => void;
  previousEnd: number;
}

export default function EventBlockTimers(props: EventBlockTimerProps) {
  const { timeStart, timeEnd, duration, delay, actionHandler, previousEnd } = props;
  const [warning, setWarnings] = useState({ start: '', end: '', duration: '' });

  const delayTime = `${delay >= 0 ? '+' : '-'} ${millisToMinutes(Math.abs(delay))}`;
  const newTime = millisToString(timeStart + delay);

  /**
   * @description Validates a time input against its pair
   * @param {string} entry - field to validate: timeStart, timeEnd, durationOverride
   * @param {number} val - field value
   * @return {boolean}
   */
  const handleValidation = useCallback(
    (field: TimeEntryField, value: number) => {
      const valid = validateEntry(field, value, timeStart, timeEnd);
      setWarnings((prev) => ({ ...prev, ...valid.warnings }));
      return valid.value;
    },
    [timeEnd, timeStart],
  );

  const handleSubmit = useCallback(
    (field: TimeEntryField, value: number) => {
      actionHandler('update', { field, value });
    },
    [actionHandler],
  );

  return (
    <div className={style.eventTimers}>
      <TimeInput
        name='timeStart'
        submitHandler={handleSubmit}
        validationHandler={handleValidation}
        time={timeStart}
        delay={delay}
        placeholder='Start'
        previousEnd={previousEnd}
        warning={warning.start}
      />
      <TimeInput
        name='timeEnd'
        submitHandler={handleSubmit}
        validationHandler={handleValidation}
        time={timeEnd}
        delay={delay}
        placeholder='End'
        previousEnd={previousEnd}
        warning={warning.end}
      />
      <TimeInput
        name='durationOverride'
        submitHandler={handleSubmit}
        validationHandler={handleValidation}
        time={duration}
        placeholder='Duration'
        previousEnd={previousEnd}
        warning={warning.duration}
      />
      {delay !== 0 && delay !== null && (
        <div className={style.delayNote}>
          {`${delayTime} minutes`}
          <br />
          {`New start: ${newTime}`}
        </div>
      )}
    </div>
  );
}
