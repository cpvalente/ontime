import { dayInMs } from './conversionUtils.js';

/**
 * Utility returns the time elapsed (gap or overlap) from the previous
 * It uses deconstructed parameters to simplify implementation in UI
 * @param currentStart the start time of the current event in ms
 * @param currentDayOffset total number of days the current event is offset by
 * @param previousStart the start time of the previous event in ms
 * @param previousDuration the duration of the previous event in ms
 * @param previousDayOffset total number of days the previous event is offset by
 */
export function getTimeFromPrevious(
  currentStart: number,
  currentDayOffset: number,
  previousStart?: number,
  previousDuration?: number,
  previousDayOffset?: number,
): number {
  // there is no previous event
  if (previousStart === undefined || previousDuration === undefined || previousDayOffset === undefined) {
    return 0;
  }

  const currentStartDayAdjusted = currentDayOffset * dayInMs + currentStart;
  const previousEndDayAdjusted = previousDayOffset * dayInMs + previousStart + previousDuration;

  return currentStartDayAdjusted - previousEndDayAdjusted;
}
