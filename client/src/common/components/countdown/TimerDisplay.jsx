import React, { memo } from 'react';
import { formatDisplay } from 'common/utils/dateConfig';
import PropTypes from 'prop-types';

import './TimerDisplay.scss';

const TimerDisplay = ({ time, small, isNegative, hideZeroHours }) => {
  // prepare display string
  const display =
    time != null && !isNaN(time) ? formatDisplay(time, hideZeroHours) : '-- : -- : --';

  const classes = `${small ? 'timer--small' : 'timer'}  ${isNegative ? 'timer--finished' : ''}`;

  return <div className={classes}>{display}</div>;
};

export default memo(TimerDisplay);

TimerDisplay.propTypes = {
  time: PropTypes.number,
  small: PropTypes.bool,
  isNegative: PropTypes.bool,
  hideZeroHours: PropTypes.bool,
};
