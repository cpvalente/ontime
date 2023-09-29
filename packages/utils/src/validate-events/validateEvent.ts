import { EndAction, TimerType } from 'ontime-types';

import { dayInMs } from '../timeConstants.js';

export function validateEndAction(maybeAction: unknown, fallback = EndAction.None) {
  if (typeof maybeAction !== 'string') {
    return fallback;
  }

  const isAction = Object.values(EndAction).includes(maybeAction as EndAction);
  if (isAction) {
    return maybeAction as EndAction;
  }
  return fallback;
}

export function validateTimerType(maybeTimerType: unknown, fallback = TimerType.CountDown) {
  if (typeof maybeTimerType !== 'string') {
    return fallback;
  }

  const isTimerType = Object.values(TimerType).includes(maybeTimerType as TimerType);
  if (isTimerType) {
    return maybeTimerType as TimerType;
  }
  return fallback;
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

export function validateTimes(_start?: number | null, _end?: number | null, _duration?: number | null) {
  const timeStart = _start ?? 0;
  const timeEnd = _end ?? 0;
  const duration = _duration ?? 0;

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
    return { timeStart, duration: _duration, timeEnd: _duration };
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
