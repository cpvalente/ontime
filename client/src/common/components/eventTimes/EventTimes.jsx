import EditableTimer from '../../input/EditableTimer';
import DelayValue from '../../input/DelayValue';

export default function EventTimes(props) {
  const { updateValues, delay, timeStart, timeEnd } = props;

  return (
    <>
      <EditableTimer
        name='timeStart'
        updateValues={updateValues}
        time={timeStart}
        delay={delay}
      />
      <EditableTimer
        name='timeEnd'
        updateValues={updateValues}
        time={timeEnd}
        delay={delay}
      />
      <DelayValue delay={delay} />
    </>
  );
}
