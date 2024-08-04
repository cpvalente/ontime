import { dayInMs } from './conversionUtils.js';

/**
 * Utility function checks whether a given event should be playing now
 */
export function checkIsNow(timeStart: number, timeEnd: number, clock: number): boolean {
  const normalisedEnd = timeEnd < timeStart ? timeEnd + dayInMs : timeEnd;
  return timeStart <= clock && clock <= normalisedEnd;
}
