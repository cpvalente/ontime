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
 * Calculates how long a time is and how many days it spans
 */
export function calculateEndAndDaySpan(end: MaybeNumber): [MaybeNumber, number] {
  if (end !== null && end > dayInMs) {
    return [end % dayInMs, Math.floor(end / dayInMs)];
  }

  return [end, 0];
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
