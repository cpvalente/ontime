import { useCallback, useContext } from 'react';
import TimeInput from 'common/components/input/TimeInput';
import { LoggingContext } from 'common/context/LoggingContext';
import { millisToMinutes } from 'common/utils/dateConfig';
import { stringFromMillis } from 'common/utils/time';
import { validateEntry } from 'common/utils/timesManager';
import PropTypes from 'prop-types';

import style from '../EventBlock.module.scss';

export default function EventBlockTimers(props) {
  const { timeStart, timeEnd, duration, delay, actionHandler, previousEnd } = props;
  const { emitWarning } = useContext(LoggingContext);

  const delayTime = `${delay >= 0 ? '+' : '-'} ${millisToMinutes(Math.abs(delay))}`;
  const newTime = stringFromMillis(timeStart + delay);

  /**
   * @description Validates a time input against its pair
   * @param {string} entry - field to validate: timeStart, timeEnd, durationOverride
   * @param {number} val - field value
   * @return {boolean}
   */
  const handleValidation = useCallback(
    (field, value) => {
      const valid = validateEntry(field, value, timeStart, timeEnd);
      if (!valid.value) {
        emitWarning(`Time Input Warning: ${valid.catch}`);
      }
      return valid.value;
    },
    [emitWarning, timeEnd, timeStart]
  );

  const handleSubmit = useCallback(
    (field, value) => {
      actionHandler('update', { field, value });
    },
    [actionHandler]
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
      />
      <TimeInput
        name='timeEnd'
        submitHandler={handleSubmit}
        validationHandler={handleValidation}
        time={timeEnd}
        delay={delay}
        placeholder='End'
        previousEnd={previousEnd}
      />
      <TimeInput
        name='duration'
        submitHandler={handleSubmit}
        validationHandler={handleValidation}
        time={duration}
        delay={delay}
        placeholder='Duration'
        previousEnd={previousEnd}
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

EventBlockTimers.propTypes = {
  timeStart: PropTypes.number,
  timeEnd: PropTypes.number,
  duration: PropTypes.number,
  delay: PropTypes.number,
  actionHandler: PropTypes.func,
  previousEnd: PropTypes.number,
};
