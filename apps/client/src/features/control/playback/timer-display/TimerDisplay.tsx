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

  if (time == null) {
    return <div className={style.timer}>{timerPlaceholder}</div>;
  }

  const isNegative = time < 0;
  const display = millisToString(Math.abs(time), { fallback: timerPlaceholder });
  const classes = cx([style.timer, isNegative ? style.finished : null]);

  return <div className={classes}>{display}</div>;
}
