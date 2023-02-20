import { memo } from 'react';
import { TimeManagerType } from 'common/models/TimeManager.type';
import { TimerType } from 'ontime-types';

import { formatDisplay, millisToSeconds } from '../../utils/dateConfig';

import './TimerDisplay.scss';

interface TimerDisplayProps {
  time?: number | null;
  small?: boolean;
  hideZeroHours?: boolean;
  className?: string;
  timer?: TimeManagerType;
}

function deriveTimerValues(timer) {
  if (timer.timerType === TimerType.CountDown) {
    return timer.current;
  } else if (timer.timerType === TimerType.CountUp) {
    const time = timer.duration - timer.current;
    return time;
  } else if (timer.timerType === TimerType.Clock) {
    return timer.clock;
  } else {
    return '-- : -- : --';
  }
}

/**
 * Displays time in ms in formatted timetag
 * @param props
 * @constructor
 */
const TimerDisplay = (props: TimerDisplayProps) => {
  const { time, small, hideZeroHours, className = '', timer } = props;

  // const display =
  //   time === null || typeof time === 'undefined' || isNaN(time)
  //     ? '-- : -- : --'
  //     : formatDisplay(millisToSeconds(time), hideZeroHours);

  const display = time
    ? formatDisplay(millisToSeconds(time), hideZeroHours)
    : formatDisplay(millisToSeconds(deriveTimerValues(timer)), hideZeroHours);

  const isNegative = (time ?? 0) < 0;
  const classes = `timer ${small ? 'timer--small' : ''} ${isNegative ? 'timer--finished' : ''} ${className}`;

  return <div className={classes}>{display}</div>;
};

export default memo(TimerDisplay);
