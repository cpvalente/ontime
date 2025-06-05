import type { MaybeNumber } from 'ontime-types';
import { TimerType } from 'ontime-types';

export const MILLIS_PER_SECOND = 1000;
export const MILLIS_PER_MINUTE = 1000 * 60;
export const MILLIS_PER_HOUR = 1000 * 60 * 60;

export const dayInMs = 86400000;
export const maxDuration = dayInMs - MILLIS_PER_SECOND;

/**
 * Converts value in milliseconds to seconds
 * @param millis
 * @returns
 */
export function millisToSeconds(
  millis: MaybeNumber,
  direction: TimerType.CountDown | TimerType.CountUp = TimerType.CountDown,
) {
  if (millis === null) return 0;

  let seconds = 0;
  if (direction === TimerType.CountDown) {
    seconds = Math.ceil(millis / MILLIS_PER_SECOND);
  }

  if (direction === TimerType.CountUp) {
    seconds = Math.floor(millis / MILLIS_PER_SECOND);
  }

  // this is there to avoid result giving -0
  return seconds === 0 ? 0 : seconds;
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
