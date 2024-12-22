import type { MaybeNumber } from 'ontime-types';

export const MILLIS_PER_SECOND = 1000;
export const MILLIS_PER_MINUTE = 1000 * 60;
export const MILLIS_PER_HOUR = 1000 * 60 * 60;

export const dayInMs = 86400000;
export const maxDuration = dayInMs - MILLIS_PER_SECOND;

/**
 * Utility converts milliseconds to a specific unit
 * @param millis
 * @param conversion
 * @returns
 */
function convertMillis(millis: MaybeNumber, conversion: number): number {
  if (!millis) {
    return 0;
  }
  return Math.floor(millis / conversion);
}

/**
 * Converts value in milliseconds to seconds
 * @param millis
 * @returns
 */
export function millisToSeconds(millis: MaybeNumber): number {
  return convertMillis(millis, MILLIS_PER_SECOND);
}

export function millisToUISeconds(millis: MaybeNumber): number {
  if (millis === null) {
    return 0;
  }

  const isNegative = millis < 0;
  const val = Math.abs(millis);

  const remainder = val % MILLIS_PER_SECOND;

  if (isNegative) {
    if (remainder <= 1000 - 32) {
      const ret = Math.ceil(millis / MILLIS_PER_SECOND);
      // eslint-disable-next-line no-compare-neg-zero
      return ret === -0 ? 0 : ret;
    }

    return Math.floor(millis / MILLIS_PER_SECOND);
  }

  if (remainder <= 32) {
    return Math.floor(val / MILLIS_PER_SECOND);
  }

  return Math.ceil(val / MILLIS_PER_SECOND);
}

/**
 * Converts value in milliseconds to minutes
 * @param millis
 * @returns
 */
export function millisToMinutes(millis: MaybeNumber): number {
  return convertMillis(millis, MILLIS_PER_MINUTE);
}

/**
 * Converts value in milliseconds to hours
 * @param millis
 * @returns
 */
export function millisToHours(millis: MaybeNumber): number {
  return convertMillis(millis, MILLIS_PER_HOUR);
}

/**
 * Converts value in seconds to minutes
 * @param seconds
 * @returns
 */
export function secondsToMinutes(seconds: number): number {
  return Math.floor(seconds / 60);
}

/**
 * Converts value in seconds to hours
 * @param seconds
 * @returns
 */
export function secondsToHours(seconds: number): number {
  return Math.floor(seconds / 3600);
}

/**
 * @description Returns amount of seconds in a date given in milliseconds. For studio clock second indicator
 * @param {MaybeNumber} millis time to format
 * @returns amount of elapsed seconds
 */
export function secondsInMillis(millis: MaybeNumber): number {
  if (!millis) {
    return 0;
  }
  return Math.floor((millis % MILLIS_PER_MINUTE) / MILLIS_PER_SECOND);
}
