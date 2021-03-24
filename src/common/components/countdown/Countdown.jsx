import { useEffect, useState } from 'react';
import styles from './Countdown.module.css';

function display(seconds) {
  const format = (val) => `0${Math.floor(val)}`.slice(-2);
  const hours = seconds / 3600;
  const minutes = (seconds % 3600) / 60;

  if (hours < 1) return [minutes, seconds % 60].map(format).join(':');
  else return [hours, minutes, seconds % 60].map(format).join(':');
}

export default function Countdown({ time, small }) {
  const [counter, setCounter] = useState(time);

  useEffect(() => {
    counter > 0 && setTimeout(() => setCounter(counter - 1), 1000);
  }, [counter]);

  return <div
  className={small ? styles.countdownClockSmall : styles.countdownClock}
  >{display(counter)}</div>;
}
