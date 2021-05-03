import { memo, useEffect, useState } from 'react';
import { formatDisplay } from '../../dateConfig';
import styles from './Countdown.module.css';

const Countdown = ({ time, small, negative, hideZeroHours }) => {
  const [clock, setClock] = useState(time);
  let display = '-- : -- : --';

  useEffect(() => {
    setClock(time);
  }, [time]);

  // prepare display string
  if (clock != null && !isNaN(clock))
    display = formatDisplay(Math.abs(clock), hideZeroHours);
  const colour = negative ? '#ff7597' : '#fffffa';
  return (
    <div
      className={small ? styles.countdownClockSmall : styles.countdownClock}
      style={{ color: colour }}
    >
      {display}
    </div>
  );
};

export default memo(Countdown);
