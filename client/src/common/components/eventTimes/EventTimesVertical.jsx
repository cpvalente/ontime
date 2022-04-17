import React, { useContext } from 'react';
import { LoggingContext } from '../../../app/context/LoggingContext';
import { validateTimes } from '../../../app/entryValidator';
import PropTypes from 'prop-types';
import TimesDelayed from './TimesDelayed';
import Times from './Times';

export default function EventTimesVertical(props) {
  const { delay, timeStart, timeEnd, duration, previousEnd, actionHandler } = props;
  const { emitWarning } = useContext(LoggingContext);

  /**
   * This code is duplicated from EventTimes
   * @description Validates a time input against its pair
   * @param {string} entry - field to validate: timeStart, timeEnd, durationOverride
   * @param {number} val - field value
   * @return {boolean}
   */
  const handleValidate = (entry, val) => {
    if (val == null || timeStart == null || timeEnd == null) return true;
    if (timeStart === 0) return true;

    let start = timeStart;
    let end = timeEnd;
    if (entry === 'timeStart') {
      start = val;
    } else if (entry === 'timeEnd') {
      end = val;
    } else return entry === 'durationOverride';

    const valid = validateTimes(start, end);
    // give warning but not enforce validation
    if (!valid.value) {
      emitWarning(`Time Input Warning: ${valid.catch}`);
    }
    return valid.value;
  };

  return delay != null && delay !== 0 ? (
    <TimesDelayed
      handleValidate={handleValidate}
      actionHandler={actionHandler}
      delay={delay}
      timeStart={timeStart}
      timeEnd={timeEnd}
      duration={duration}
      previousEnd={previousEnd}
    />
  ) : (
    <Times
      handleValidate={handleValidate}
      actionHandler={actionHandler}
      timeStart={timeStart}
      timeEnd={timeEnd}
      duration={duration}
      previousEnd={previousEnd}
    />
  );
}

EventTimesVertical.propTypes = {
  delay: PropTypes.number,
  timeStart: PropTypes.number,
  timeEnd: PropTypes.number,
  duration: PropTypes.number,
  previousEnd: PropTypes.number,
  actionHandler: PropTypes.func.isRequired,
};
