import EditableTimer from '../../input/EditableTimer';
import { showWarningToast } from '../../helpers/toastManager';

export default function EventTimes(props) {
  const { actionHandler, delay, timeStart, timeEnd } = props;

  const handleValidate = (entry, v) => {
    // we dont inforce validation here

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

  return (
    <>
      <EditableTimer
        name='timeStart'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={timeStart}
        delay={delay}
      />
      <EditableTimer
        name='timeEnd'
        validate={handleValidate}
        actionHandler={actionHandler}
        time={timeEnd}
        delay={delay}
      />
    </>
  );
}
