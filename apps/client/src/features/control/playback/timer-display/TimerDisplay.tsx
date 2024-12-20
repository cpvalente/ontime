import { MaybeNumber } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import { cx, timerPlaceholder } from '../../../../common/utils/styleUtils';

import style from './TimerDisplay.module.scss';

interface TimerDisplayProps {
  time: MaybeNumber;
}

/**
 * Displays time in ms in formatted timetag
 * Used in editor
 */
export default function TimerDisplay(props: TimerDisplayProps) {
  const { time } = props;

  const isNegative = (time ?? 0) < 0;
  const display =
    time == null ? timerPlaceholder : millisToString(time, { fallback: timerPlaceholder }).replace('-', '');
  const classes = cx([style.timer, isNegative ? style.finished : null, time === null && style.muted]);

  return <div className={classes}>{display}</div>;
}
