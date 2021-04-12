import EditableTimer from '../../input/EditableTimer';
import DelayValue from '../../input/DelayValue';

export default function EventTimes(props) {
  const { updateValues, delay, timeStart, timeEnd } = props;

  // TODO: how to handle midnight rollover
  const handleValidate = (entry, v) => {
    // if one of the fields is not set, all good

    if (v == null || timeStart == null || timeEnd == null) return true;

    if (entry === 'timeStart') return v < timeEnd;
    else if (entry === 'timeEnd') return v > timeStart;

    // shouldnt come to this
    return false;
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
