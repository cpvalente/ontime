import EditableTimer from '../../input/EditableTimer';
import DelayValue from '../../input/DelayValue';
import { showErrorToast } from '../../helpers/toastManager';

export default function EventTimes(props) {
  const { updateValues, delay, timeStart, timeEnd } = props;

  // TODO: how to handle midnight rollover
  const handleValidate = (entry, v) => {
    // if one of the fields is not set, all good

    if (v == null || timeStart == null || timeEnd == null) return true;
    if (v === 0 || timeStart === 0 || timeEnd === 0) return true;

    let validate = { value: false, catch: 'undefined error' };
    if (entry === 'timeStart')
      validate = { value: v < timeEnd, catch: 'Start time later than end time' };
    else if (entry === 'timeEnd')
      validate = { value: v > timeStart, catch: 'End time earlier than start time' };

    if (validate.value === false)
      showErrorToast('Time Input Invalid', validate.catch);
    return validate.value;
  };

  return (
    <>
      <DelayValue delay={delay} />
      <EditableTimer
        name='timeStart'
        validate={handleValidate}
        updateValues={updateValues}
        time={timeStart}
        delay={delay}
      />
      <EditableTimer
        name='timeEnd'
        validate={handleValidate}
        updateValues={updateValues}
        time={timeEnd}
        delay={delay}
      />
    </>
  );
}
