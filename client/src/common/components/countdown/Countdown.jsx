import { useEffect, useState } from 'react';
import { formatDisplay } from '../../dateConfig';
import styles from './Countdown.module.css';

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
