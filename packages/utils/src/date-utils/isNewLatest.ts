import { checkIsNextDay } from './checkIsNextDay.js';

/**
 * Checks whether a new element is the latest in the list
 */
export function isNewLatest(timeStart: number, timeEnd: number, previousStart?: number, previousEnd?: number): boolean {
  // true if there is no previous
  if (previousStart === undefined || previousEnd === undefined) {
    return true;
  }

  // true if it starts after the previous is finished
  if (timeStart >= previousEnd) {
    return true;
  }

  // true if it finishes later than previous
  if (timeEnd > previousEnd) {
    return true;
  }

  // true if it is the day after
  return checkIsNextDay(previousStart, timeStart, previousEnd - previousStart);
}
