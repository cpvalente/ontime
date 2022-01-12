import EditableTimer from 'common/input/EditableTimer';
import { useContext } from 'react';
import { LoggingContext } from '../../../app/context/LoggingContext';
import { validateTimes } from '../../../app/entryValidator';
import PropTypes from 'prop-types';

export default function EventTimes(props) {
  const { actionHandler, delay, timeStart, timeEnd, previousEnd } = props;
  const { emitWarning } = useContext(LoggingContext);

  const handleValidate = (entry, val) => {
    if (val == null || timeStart == null || timeEnd == null) return true;
    if (timeStart === 0) return true;

    let start = timeStart;
    let end = timeEnd;
    if (entry === 'timeStart') {
      start = val;
    } else if (entry === 'timeEnd') {
      end = val;
    } else {
      return;
    }

    const valid = validateTimes(start, end);
    // give warning but not enforce validation
    if (!valid.value) {
      emitWarning(`Time Input Warning: ${valid.catch}`);
    }
    return valid.value;
  };

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
  delay: PropTypes.number.isRequired,
  timeStart: PropTypes.number.isRequired,
  timeEnd: PropTypes.number.isRequired,
  previousEnd: PropTypes.number.isRequired,
};
