import { MaybeNumber } from 'ontime-types';

import { formatDuration } from './time';

/**
 * Parses a value in milliseconds to a string which encodes a delay
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
  const time = formatDuration(absMillis, false);

  return `${isNegative ? ahead : delayed}${time}`;
}
