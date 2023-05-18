import { memo } from 'react';

import { formatDisplay } from '../../utils/dateConfig';

import './TimerDisplay.scss';

interface TimerDisplayProps {
  time?: number | null;
}

/**
 * Displays time in ms in formatted timetag
 * @param props
 * @constructor
 */
const TimerDisplay = (props: TimerDisplayProps) => {
  const { time } = props;

  let display = '';

  if (time === null || typeof time === 'undefined' || isNaN(time)) {
    display = '-- : -- : --';
  } else {
    display = formatDisplay(time);
  }

  const isNegative = (time ?? 0) < 0;

  const classes = `timer ${isNegative ? 'timer--finished' : ''}`;

  return <div className={classes}>{display}</div>;
};

export default memo(TimerDisplay);
