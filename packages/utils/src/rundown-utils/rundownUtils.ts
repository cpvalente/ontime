import { dayInMs } from '../timeConstants.js';

/**
 * @description calculates event duration considering midnight
 * @param {number} timeStart
 * @param {number} timeEnd
 * @returns {number}
 */
export const calculateDuration = (timeStart: number, timeEnd: number): number => {
  // Durations must be positive
  if (timeEnd < timeStart) {
    return timeEnd + dayInMs - timeStart;
  }
  return timeEnd - timeStart;
};
