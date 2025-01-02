import type { OntimeEventDAO } from 'ontime-types';
import { TimeStrategy } from 'ontime-types';

import { dayInMs } from '../date-utils/conversionUtils.js';
import { validateTimeStrategy } from '../validate-events/validateEvent.js';

export function getLinkedTimes(
  target: OntimeEventDAO,
  source: OntimeEventDAO,
): { timeStart: number; duration: number; timeEnd: number } {
  const lockEnd = target.timeStrategy === TimeStrategy.LockEnd;
  const lockDuration = target.timeStrategy === TimeStrategy.LockDuration;
  const newStart = source.timeEnd;

  const timePatch = {
    timeStart: newStart,
    timeEnd: lockEnd ? target.timeEnd : calculateEnd(newStart, target.duration),
    duration: lockDuration ? target.duration : calculateDuration(newStart, target.timeEnd),
  };

  return timePatch;
}

function inferTimes(
  _start?: unknown,
  _end?: unknown,
  _duration?: unknown,
): { timeStart: number; duration: number; timeEnd: number; timeStrategy: TimeStrategy } {
  const timeStart = convertToInteger(_start);
  const timeEnd = convertToInteger(_end);
  const duration = convertToInteger(_duration);

  // TODO: prevent overflow

  if (_start != null && _end != null) {
    // Case 1. if we have start and end, duration must be derived
    return {
      timeStart,
      duration: calculateDuration(timeStart, timeEnd),
      timeEnd,
      timeStrategy: _duration != null ? TimeStrategy.LockDuration : TimeStrategy.LockEnd,
    };
  }

  if (_start == null && _end == null) {
    if (_duration == null) {
      // Case 2. no valid times were given
      return { timeStart: 0, duration: 0, timeEnd: 0, timeStrategy: TimeStrategy.LockDuration };
    }
    // Case 3. we have a duration and infer the rest
    return { timeStart, duration, timeEnd: duration, timeStrategy: TimeStrategy.LockDuration };
  }

  if (_start != null) {
    // Case 5. with only start, we can calculate the rest
    return { timeStart, duration, timeEnd: (timeStart + duration) % dayInMs, timeStrategy: TimeStrategy.LockDuration };
  }

  if (_end != null) {
    // Case 6. with only end, we can calculate the rest
    return {
      timeStart: timeEnd - duration,
      duration,
      timeEnd,
      timeStrategy: _duration != null ? TimeStrategy.LockDuration : TimeStrategy.LockEnd,
    };
  }

  // we should have covered all cases
  return { timeStart, duration, timeEnd, timeStrategy: TimeStrategy.LockDuration };
}

/**
 * Ensures the time input variables are valid in relationship to each other
 * Infers values if necessary
 * @param _start
 * @param _end
 * @param _duration
 */
export function validateTimes(
  _start?: unknown,
  _end?: unknown,
  _duration?: unknown,
  _strategy?: TimeStrategy,
): { timeStart: number; duration: number; timeEnd: number; timeStrategy: TimeStrategy } {
  if (_strategy == null) {
    // if no strategy is given we infer it from given parameters
    return inferTimes(_start, _end, _duration);
  }

  const timeStrategy = validateTimeStrategy(_strategy);
  const timeStart = convertToInteger(_start);
  let timeEnd = convertToInteger(_end);
  let duration = convertToInteger(_duration);

  if (timeStrategy === TimeStrategy.LockEnd) {
    duration = calculateDuration(timeStart, timeEnd);
  } else {
    timeEnd = calculateEnd(timeStart, duration);
  }
  return { timeStart, duration, timeEnd, timeStrategy };
}

/**
 * @description calculates event duration considering midnight
 * @param {number} timeStart
 * @param {number} timeEnd
 * @returns {number}
 */
export function calculateDuration(timeStart: number, timeEnd: number): number {
  // Durations must be positive
  if (timeEnd < timeStart) {
    return timeEnd + dayInMs - timeStart;
  }
  return timeEnd - timeStart;
}

export function calculateEnd(timeStart: number, duration: number): number {
  return (timeStart + duration) % dayInMs;
}

/**
 * Converts a given value to an int, returns 0 otherwise
 * @param value
 * number
 */
function convertToInteger(value: unknown): number {
  const result = Number(value);
  return isNaN(result) ? 0 : Math.floor(result);
}
