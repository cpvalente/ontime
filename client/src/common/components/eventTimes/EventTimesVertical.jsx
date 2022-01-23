import EditableTimer from 'common/input/EditableTimer';
import { stringFromMillis } from 'ontime-utils/time';
import { useContext } from 'react';
import { LoggingContext } from '../../../app/context/LoggingContext';
import { validateTimes } from '../../../app/entryValidator';
import PropTypes from 'prop-types';

const label = {
  fontSize: '0.75em',
  color: '#aaa',
};

const TimesDelayed = (props) => {
  const { handleValidate, actionHandler, delay, timeStart, timeEnd, duration, previousEnd } = props;

  const scheduledStart = stringFromMillis(timeStart, false);
  const scheduledEnd = stringFromMillis(timeEnd, false);

  return (
    <>
      <span style={label}>
        Start <span>{scheduledStart}</span>
      </span>
      <EditableTimer
        name='timeStart'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={timeStart}
        delay={delay}
        previousEnd={previousEnd}
      />
      <span style={label}>
        End <span>{scheduledEnd}</span>
      </span>
      <EditableTimer
        name='timeEnd'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={timeEnd}
        delay={delay}
        previousEnd={previousEnd}
      />
      <span style={label}>Duration</span>
      <EditableTimer
        name='durationOverride'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={duration}
        delay={0}
        previousEnd={previousEnd}
      />
    </>
  );
};

TimesDelayed.propTypes = {
  handleValidate: PropTypes.func.isRequired,
  actionHandler: PropTypes.func.isRequired,
  delay: PropTypes.number.isRequired,
  timeStart: PropTypes.number.isRequired,
  timeEnd: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  previousEnd: PropTypes.number.isRequired,
};

const Times = (props) => {
  const { handleValidate, actionHandler, timeStart, timeEnd, duration, previousEnd } = props;

  return (
    <>
      <span style={label}>Start</span>
      <EditableTimer
        name='timeStart'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={timeStart}
        delay={0}
        previousEnd={previousEnd}
      />
      <span style={label}>End</span>
      <EditableTimer
        name='timeEnd'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={timeEnd}
        delay={0}
        previousEnd={previousEnd}
      />
      <span style={label}>Duration</span>
      <EditableTimer
        name='durationOverride'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={duration}
        delay={0}
        previousEnd={previousEnd}
      />
    </>
  );
};

Times.propTypes = {
  handleValidate: PropTypes.func.isRequired,
  actionHandler: PropTypes.func.isRequired,
  timeStart: PropTypes.number.isRequired,
  timeEnd: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  previousEnd: PropTypes.number.isRequired,
};

export default function EventTimesVertical(props) {
  const { delay, timeStart, timeEnd, duration, previousEnd } = props;
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

  return delay != null && delay !== 0 ? (
    <TimesDelayed
      handleValidate={handleValidate}
      actionHandler={props.actionHandler}
      delay={delay}
      timeStart={timeStart}
      timeEnd={timeEnd}
      duration={duration}
      previousEnd={previousEnd}
    />
  ) : (
    <Times
      handleValidate={handleValidate}
      actionHandler={props.actionHandler}
      timeStart={timeStart}
      timeEnd={timeEnd}
      duration={duration}
      previousEnd={previousEnd}
    />
  );
}

EventTimesVertical.propTypes = {
  delay: PropTypes.number.isRequired,
  timeStart: PropTypes.number.isRequired,
  timeEnd: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  previousEnd: PropTypes.number.isRequired,
};