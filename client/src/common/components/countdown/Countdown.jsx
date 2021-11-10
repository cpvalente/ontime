import { memo } from 'react';
import { formatDisplay } from 'common/utils/dateConfig';
import styles from './Countdown.module.css';

const Countdown = ({ time, small, negative, hideZeroHours }) => {
  let display = '-- : -- : --';

  // prepare display string
  if (time != null && !isNaN(time))
    display = formatDisplay(Math.abs(time), hideZeroHours);
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
