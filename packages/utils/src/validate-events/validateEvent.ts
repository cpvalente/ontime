import { EndAction, OntimeEvent, TimerType } from 'ontime-types';

import { dayInMs } from '../timeConstants.js';

/**
 * Checks if given value is a valid type of EndAction, returns the fallback otherwise
 * @param {EndAction} maybeAction
 * @param {EndAction} [fallback]
 */
export function validateEndAction(maybeAction: unknown, fallback = EndAction.None): EndAction {
  return Object.values(EndAction).includes(maybeAction as EndAction) ? (maybeAction as EndAction) : fallback;
}

/**
 * Checks if given value is a valid type of TimerType, returns the fallback otherwise
 * @param {TimerType} maybeTimerType
 * @param {TimerType} [fallback]
 */
export function validateTimerType(maybeTimerType: unknown, fallback = TimerType.CountDown): TimerType {
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
export function validateTimes(
  _start?: unknown,
  _end?: unknown,
  _duration?: unknown,
): { timeStart: number; duration: number; timeEnd: number } {
  const timeStart = convertToInteger(_start);
  const timeEnd = convertToInteger(_end);
  const duration = convertToInteger(_duration);

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

/**
 * Creates a valid patch object for an OntimeEvent
 * @throws if there is not enough data to do so
 * @param event
 */
export function validatePatch(event: Partial<OntimeEvent>) {
  const mustBeOfType = (value: unknown, type: string) => {
    if (typeof value !== type) {
      throw new Error('Invalid patch event');
    }
  };

  if ('cue' in event) mustBeOfType(event.cue, 'string');
  if ('colour' in event) mustBeOfType(event.colour, 'string');
  if ('title' in event) mustBeOfType(event.title, 'string');
  if ('subtitle' in event) mustBeOfType(event.subtitle, 'string');
  if ('presenter' in event) mustBeOfType(event.presenter, 'string');
  if ('note' in event) mustBeOfType(event.note, 'string');
  if ('user0' in event) mustBeOfType(event.user0, 'string');
  if ('user1' in event) mustBeOfType(event.user1, 'string');
  if ('user2' in event) mustBeOfType(event.user2, 'string');
  if ('user3' in event) mustBeOfType(event.user3, 'string');
  if ('user4' in event) mustBeOfType(event.user4, 'string');
  if ('user5' in event) mustBeOfType(event.user5, 'string');
  if ('user7' in event) mustBeOfType(event.user7, 'string');
  if ('user8' in event) mustBeOfType(event.user8, 'string');
  if ('user9' in event) mustBeOfType(event.user9, 'string');

  if ('isPublic' in event) mustBeOfType(event.isPublic, 'boolean');
  if ('skip' in event) mustBeOfType(event.skip, 'boolean');

  if ('timeStart' in event) mustBeOfType(event.timeStart, 'number');
  if ('timeEnd' in event) mustBeOfType(event.timeEnd, 'number');
  if ('duration' in event) mustBeOfType(event.duration, 'number');
  if ('timeWarning' in event) mustBeOfType(event.timeWarning, 'number');
  if ('timeDanger' in event) mustBeOfType(event.timeDanger, 'number');
}
