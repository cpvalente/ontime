import { useEffect, useState } from 'react';
import styles from './Countdown.module.css';

function formatDisplay(seconds) {
  const format = (val) => `0${Math.floor(val)}`.slice(-2);
  const hours = seconds / 3600;
  const minutes = (seconds % 3600) / 60;

  return [hours, minutes, seconds % 60].map(format).join(':');
}

export default function Countdown(props) {
  const { time, small } = props;
  const [clock, setClock] = useState(time);
  let display = '-- : -- : --';

  useEffect(() => {
    setClock(time);
  }, [time]);

  // prepare display string
  if (clock != null && !isNaN(clock)) display = formatDisplay(clock);

  return (
    <div className={small ? styles.countdownClockSmall : styles.countdownClock}>
      {display}
    </div>
  );
}
