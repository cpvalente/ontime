import { useEffect, useState } from 'react';
import styles from './Countdown.module.css';

function formatDisplay(seconds, hideZero) {
  const format = (val) => `0${Math.floor(val)}`.slice(-2);
  const hours = seconds / 3600;
  const minutes = (seconds % 3600) / 60;

  if (hideZero && hours < 1)
    return [minutes, seconds % 60].map(format).join(':');
  else return [hours, minutes, seconds % 60].map(format).join(':');
}

export default function Countdown(props) {
  const { time, small, hideZeroHours } = props;
  const [clock, setClock] = useState(time);
  let display = '-- : -- : --';

  useEffect(() => {
    setClock(time);
  }, [time]);

  // prepare display string
  if (clock != null && !isNaN(clock))
    display = formatDisplay(clock, hideZeroHours);

  return (
    <div className={small ? styles.countdownClockSmall : styles.countdownClock}>
      {display}
    </div>
  );
}
