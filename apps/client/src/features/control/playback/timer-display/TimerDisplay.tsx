import { MaybeNumber, TimerPhase } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import { cx, timerPlaceholder } from '../../../../common/utils/styleUtils';

import style from './TimerDisplay.module.scss';

interface TimerDisplayProps {
  time: MaybeNumber;
  phase: TimerPhase;
  className?: string;
}

/**
 * Displays time in ms in formatted timetag
 * Used in editor
 */
export default function TimerDisplay({ time, phase, className }: TimerDisplayProps) {
  const display = millisToString(time, { fallback: timerPlaceholder }).replace('-', '');

  return (
    <div className={cx([style.timer, className])} data-phase={phase}>
      {display}
    </div>
  );
}
