import { TimerType } from 'ontime-types';

import { TimeManagerType } from '../../models/TimeManager.type';

/**
 * Calculate derived data from given timer object
 * @param timer
 */
export function getSelectedTimerByType(timer?: TimeManagerType): number | null {
  if (typeof timer === 'undefined') {
    return null;
  }
  if (timer.timerType === TimerType.CountDown) {
    return timer.current;
  } else if (timer.timerType === TimerType.CountUp) {
    return timer.duration - timer.current;
  } else if (timer.timerType === TimerType.Clock) {
    return timer.clock;
  }
  return null;
}
