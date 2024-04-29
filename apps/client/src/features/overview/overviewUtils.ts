import { MaybeNumber } from 'ontime-types';
import { dayInMs, millisToString } from 'ontime-utils';

import { enDash, timerPlaceholder } from '../../common/utils/styleUtils';

/**
 * Encapsulates the logic for formatting time in overview
 * @param time
 * @returns
 */
export function formatedTime(time: MaybeNumber) {
  return millisToString(time, { fallback: timerPlaceholder });
}

/**
 * Calculates a day span from a number range
 * @param end
 * @returns
 */
export function calculateEndAndDaySpan(end: MaybeNumber): [MaybeNumber, number] {
  let maybeEnd = end;
  let maybeDaySpan = 0;
  if (end !== null) {
    if (end > dayInMs) {
      maybeEnd = end % dayInMs;
      maybeDaySpan = Math.floor(end / dayInMs);
    }
  }
  return [maybeEnd, maybeDaySpan];
}

/**
 * Formats offset text
 * @param offset
 * @returns
 */
export function getOffsetText(offset: MaybeNumber): string {
  if (offset === null) {
    return enDash;
  }
  return millisToString(offset, { fallback: enDash });
}
