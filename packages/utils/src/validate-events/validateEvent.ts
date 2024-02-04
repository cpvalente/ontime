import { EndAction, TimerType } from 'ontime-types';

import { dayInMs } from '../timeConstants.js';

/**
 * Checks if given value is a valid type of EndAction, returns the fallback otherwise
 * @param {EndAction} maybeAction
 * @param {EndAction} [fallback]
 */
export function validateEndAction(maybeAction: unknown, fallback = EndAction.None) {
  return Object.values(EndAction).includes(maybeAction as EndAction) ? (maybeAction as EndAction) : fallback;
}

/**
 * Checks if given value is a valid type of TimerType, returns the fallback otherwise
 * @param {TimerType} maybeTimerType
 * @param {TimerType} [fallback]
 */
export function validateTimerType(maybeTimerType: unknown, fallback = TimerType.CountDown) {
  return Object.values(TimerType).includes(maybeTimerType as TimerType) ? (maybeTimerType as TimerType) : fallback;
}

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

/**
 * Converts a given value to an int, returns 0 otherwise
 * @param value
 * number
 */
function convertToInteger(value: unknown): number {
  const result = Number(value);
  return isNaN(result) ? 0 : Math.floor(result);
}

/**
 * Ensures the time input variables are valid in relationship to each other
 * Infers values if necessary
 * @param _start
 * @param _end
 * @param _duration
 */
export function validateTimes(_start?: unknown, _end?: unknown, _duration?: unknown) {
  const timeStart = convertToInteger(_start) % dayInMs;
  const timeEnd = convertToInteger(_end) % dayInMs;
  const duration = convertToInteger(_duration) % dayInMs;

  if (_start != null && _end != null) {
    // Case 1. if we have start and end, duration must be derived
    return { timeStart, duration: calculateDuration(timeStart, timeEnd), timeEnd };
  }

  if (_start == null && _end == null) {
    if (_duration == null) {
      // Case 2. no valid times were given
      return { timeStart, duration, timeEnd };
    }
    // Case 3. we have a duration and infer the rest
    return { timeStart, duration, timeEnd: duration };
  }

  if (_start != null) {
    // Case 5. with only start, we can calculate the rest
    return { timeStart, duration, timeEnd: timeStart + duration };
  }

  if (_end != null) {
    // Case 6. with only end, we can calculate the rest
    return { timeStart: timeEnd - duration, duration, timeEnd };
  }

  // we should have covered all cases
  return { timeStart, duration, timeEnd };
}
