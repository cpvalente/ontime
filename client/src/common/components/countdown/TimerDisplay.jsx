import React, { memo } from 'react';
import { formatDisplay } from 'common/utils/dateConfig';
import PropTypes from 'prop-types';

import './TimerDisplay.scss';

const TimerDisplay = ({ time, small, isNegative, hideZeroHours }) => {

  const display =
    (time === null || typeof time === 'undefined' || isNaN(time))
      ? '-- : -- : --'
      : formatDisplay(time, hideZeroHours);

  const classes = `timer ${small ? 'timer--small' : ''}  ${isNegative ? 'timer--finished' : ''}`;

  return <div className={classes}>{display}</div>;
};

export default memo(TimerDisplay);

TimerDisplay.propTypes = {
  time: PropTypes.number,
  small: PropTypes.bool,
  isNegative: PropTypes.bool,
  hideZeroHours: PropTypes.bool,
};
