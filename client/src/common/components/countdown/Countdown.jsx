import { memo } from 'react';
import { formatDisplay } from 'common/utils/dateConfig';
import PropTypes from 'prop-types';
import styles from './Countdown.module.css';

const Countdown = ({ time, small, isNegative, hideZeroHours }) => {
  // prepare display string
  const display =
    time != null && !isNaN(time)
      ? formatDisplay(time, hideZeroHours)
      : '-- : -- : --';

  const colour = isNegative ? '#ff7597' : '#fffffa';

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

Countdown.propTypes = {
  time: PropTypes.number.isRequired,
  small: PropTypes.bool,
  isNegative: PropTypes.bool,
  hideZeroHour: PropTypes.bool,
};
