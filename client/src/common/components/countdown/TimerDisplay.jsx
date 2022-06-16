import React, { memo } from 'react';
import { formatDisplay } from 'common/utils/dateConfig';
import PropTypes from 'prop-types';

import styles from './TimerDisplay.module.scss';

const TimerDisplay = ({ time, small, isNegative, hideZeroHours }) => {
  // prepare display string
  const display =
    time != null && !isNaN(time) ? formatDisplay(time, hideZeroHours) : '-- : -- : --';

  const classes = `${small ? styles.countdownClockSmall : styles.countdownClock} 
  ${isNegative ? styles.negative : ''}`;

  return (
    <div className={classes}>
      {display}
    </div>
  );
};

export default memo(TimerDisplay);

TimerDisplay.propTypes = {
  time: PropTypes.number,
  small: PropTypes.bool,
  isNegative: PropTypes.bool,
  hideZeroHours: PropTypes.bool,
};
