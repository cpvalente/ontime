import { memo } from 'react';

import { formatDisplay, millisToSeconds } from '../../utils/dateConfig';

import './TimerDisplay.scss';

interface TimerDisplayProps {
  time?: string | number | null;
  small?: boolean;
  hideZeroHours?: boolean;
  className?: string;
}

/**
 * Displays time in ms in formatted timetag
 * @param props
 * @constructor
 */
const TimerDisplay = (props: TimerDisplayProps) => {
  const { time, small, hideZeroHours, className = '' } = props;

  let display = '';

  if (typeof time === 'string') {
    display = time;
  } else if (time === null || typeof time === 'undefined' || isNaN(time)) {
    display = '-- : -- : --';
  } else {
    display = formatDisplay(millisToSeconds(time), hideZeroHours);
  }

  const isNegative = (time ?? 0) < 0;

  const classes = `timer ${small ? 'timer--small' : ''} ${isNegative ? 'timer--finished' : ''} ${className}`;

  return <div className={classes}>{display}</div>;
};

export default memo(TimerDisplay);
