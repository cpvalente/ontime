import React, { memo } from 'react';
import { formatDisplay } from 'common/utils/dateConfig';
import PropTypes from 'prop-types';

import styles from './Countdown.module.scss';

const Countdown = ({ time, small, isNegative, hideZeroHours }) => {
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

export default memo(Countdown);

Countdown.propTypes = {
  time: PropTypes.number,
  small: PropTypes.bool,
  isNegative: PropTypes.bool,
  hideZeroHours: PropTypes.bool,
};
