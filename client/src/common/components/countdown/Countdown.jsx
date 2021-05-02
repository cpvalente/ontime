import { memo, useEffect, useState } from 'react';
import { formatDisplay } from '../../dateConfig';
import styles from './Countdown.module.css';

const Countdown = ({ time, small, hideZeroHours }) => {
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
};

export default memo(Countdown);
