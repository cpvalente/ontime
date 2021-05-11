import EditableTimer from '../../input/EditableTimer';
import { showWarningToast } from '../../helpers/toastManager';
import { stringFromMillis } from '../../dateConfig';

const label = {
  fontSize: '0.75em',
  color: '#aaa',
};

const TimesDelayed = (props) => {
  const {
    handleValidate,
    actionHandler,
    delay,
    timeStart,
    timeEnd,
    duration,
  } = props;

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
      />
      <span style={label}>Duration</span>
      <EditableTimer
        name='duration'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={duration}
        delay={0}
      />
    </>
  );
};

const Times = (props) => {
  const { handleValidate, actionHandler, timeStart, timeEnd, duration } = props;

  return (
    <>
      <span style={label}>Start</span>
      <EditableTimer
        name='timeStart'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={timeStart}
        delay={0}
      />
      <span style={label}>End</span>
      <EditableTimer
        name='timeEnd'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={timeEnd}
        delay={0}
      />
      <span style={label}>Duration</span>
      <EditableTimer
        name='durationOverride'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={duration}
        delay={0}
      />
    </>
  );
};

export default function EventTimesVertical(props) {
  const { delay, timeStart, timeEnd, duration } = props;
  const handleValidate = (entry, v) => {
    // we dont enforce validation here

    if (v == null || timeStart == null || timeEnd == null) return true;
    if (timeStart === 0) return true;

    let validate = { value: true, catch: '' };
    if (entry === 'timeStart' && v > timeEnd)
      validate.catch = 'Start time later than end time';
    else if (entry === 'timeEnd' && v < timeStart)
      validate.catch = 'End time earlier than start time';

    if (validate.catch !== '')
      showWarningToast('Time Input Warning', validate.catch);
    return validate.value;
  };

  return (delay != null) & (delay > 0) ? (
    <TimesDelayed
      handleValidate={handleValidate}
      actionHandler={props.actionHandler}
      delay={delay}
      timeStart={timeStart}
      timeEnd={timeEnd}
      duration={duration}
    />
  ) : (
    <Times
      handleValidate={handleValidate}
      actionHandler={props.actionHandler}
      timeStart={timeStart}
      timeEnd={timeEnd}
      duration={duration}
    />
  );
}
