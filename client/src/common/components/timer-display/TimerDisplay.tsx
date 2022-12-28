import { memo } from 'react';
import { formatDisplay } from 'common/utils/dateConfig';

import './TimerDisplay.scss';

interface TimerDisplayProps {
  time: number;
  small?: boolean;
  isNegative?: boolean;
  hideZeroHours?: boolean;
  className?: string;
}

const TimerDisplay = (props: TimerDisplayProps) => {
  const { time, small, isNegative, hideZeroHours, className = '' } = props;

  const display =
    (time === null || typeof time === 'undefined' || isNaN(time))
      ? '-- : -- : --'
      : formatDisplay(time, hideZeroHours);

  const classes = `timer ${small ? 'timer--small' : ''}  ${isNegative ? 'timer--finished' : ''} ${className}`;

  return <div className={classes}>{display}</div>;
};

export default memo(TimerDisplay);
