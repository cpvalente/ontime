import { MaybeNumber, TimerType } from 'ontime-types';
import { dayInMs, millisToString } from 'ontime-utils';

import { timerPlaceholder, timerPlaceholderMin } from '../../common/utils/styleUtils';

/**
 * Encapsulates the logic for formatting time in overview
 */
export function formattedTime(
  time: MaybeNumber,
  segments: number = 3,
  direction?: TimerType.CountDown | TimerType.CountUp,
): string {
  return millisToString(time, { fallback: segments === 3 ? timerPlaceholder : timerPlaceholderMin, direction });
}

/**
 * Calculates how long a time is and how many days it spans
 */
export function calculateEndAndDaySpan(end: MaybeNumber): [MaybeNumber, number] {
  if (end !== null && end > dayInMs) {
    return [end % dayInMs, Math.floor(end / dayInMs)];
  }

  return [end, 0];
}
