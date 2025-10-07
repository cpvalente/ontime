import { MaybeNumber, TimerType } from 'ontime-types';
import { dayInMs, millisToString } from 'ontime-utils';

import { timerPlaceholder, timerPlaceholderMin } from '../../common/utils/styleUtils';

/**
 * Composition to stop negative timers from being formatted
 * They should show a due string instead
 *
 * This is used for cases when a negative timer is unwanted
 * eg: count down to a milestone
 */
export function formatDueTime(
  time: MaybeNumber,
  segments: number = 3,
  direction?: TimerType.CountDown | TimerType.CountUp,
  dueString = 'due',
): string {
  if (time !== null && time <= 0) return dueString;
  return formattedTime(time, segments, direction);
}

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
