import React, { useCallback, useContext } from 'react';
import EditableTimer from 'common/input/EditableTimer';
import PropTypes from 'prop-types';

import { LoggingContext } from '../../../app/context/LoggingContext';
import { validateTimes } from '../../../app/entryValidator';

export default function EventTimes(props) {
  const { actionHandler, delay, timeStart, timeEnd, previousEnd } = props;
  const { emitWarning } = useContext(LoggingContext);

  /**
   * This code is duplicated from EventTimesVertical
   * @description Validates a time input against its pair
   * @param {string} entry - field to validate: timeStart, timeEnd, durationOverride
   * @param {number} val - field value
   * @return {boolean}
   */
  const handleValidate = useCallback(
    () => (entry, val) => {
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
    },
    [emitWarning, timeEnd, timeStart]
  );

  return (
    <>
      <EditableTimer
        name='timeStart'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={timeStart}
        delay={delay}
        previousEnd={previousEnd}
      />
      <EditableTimer
        name='timeEnd'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={timeEnd}
        delay={delay}
        previousEnd={previousEnd}
      />
    </>
  );
}

EventTimes.propTypes = {
  actionHandler: PropTypes.func.isRequired,
  delay: PropTypes.number,
  timeStart: PropTypes.number,
  timeEnd: PropTypes.number,
  previousEnd: PropTypes.number,
};
