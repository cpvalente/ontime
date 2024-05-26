import { MaybeNumber } from 'ontime-types';
import { formatFromMillis, MILLIS_PER_HOUR, MILLIS_PER_MINUTE } from 'ontime-utils';

/**
 * Parses a value in millis to a string which encodes a delay
 * @param millis 
 * @param format 
 */
export function millisToDelayString(millis: MaybeNumber, format: 'compact' | 'expanded' = 'compact'): string {
  if (millis == null || millis === 0) {
    return '';
  }

  const isNegative = millis < 0;
  const absMillis = Math.abs(millis);
  const isCompact = format === 'compact';
  const delayed = isCompact ? '+' : 'delayed by ';
  const ahead = isCompact ? '-' : 'ahead by ';

  if (absMillis < MILLIS_PER_MINUTE) {
    return `${isNegative ? ahead : delayed}${formatFromMillis(absMillis, 's')} sec`;
  } else if (absMillis < MILLIS_PER_HOUR && absMillis % MILLIS_PER_MINUTE === 0) {
    return `${isNegative ? ahead : delayed}${formatFromMillis(absMillis, 'm')} min`;
  }

  return `${isNegative ? ahead : delayed}${formatFromMillis(absMillis, 'HH:mm:ss')}`;
}
