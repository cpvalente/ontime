import { memo } from 'react';

import { formatDisplay, millisToSeconds } from '../../utils/dateConfig';

import './TimerDisplay.scss';

interface TimerDisplayProps {
  time?: number | null;
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

  const display =
    (time === null || typeof time === 'undefined' || isNaN(time))
      ? '-- : -- : --'
      : formatDisplay(millisToSeconds(time), hideZeroHours);

  const isNegative = (time ?? 0) < 0;
  const classes = `timer ${small ? 'timer--small' : ''} ${isNegative ? 'timer--finished' : ''} ${className}`;

  return <div className={classes}>{display}</div>;
};

export default memo(TimerDisplay);
