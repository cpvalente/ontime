type MaybeNumber = number | null;
import { dayInMs } from 'ontime-utils';

/**
 * Calculates expected finish time of a running timer
 */
export function getExpectedFinish(
  startedAt: MaybeNumber,
  finishedAt: MaybeNumber,
  duration: number,
  pausedTime: number,
  addedTime: number,
) {
  if (startedAt === null) {
    return null;
  }

  if (finishedAt !== null) {
    return finishedAt;
  }

  return Math.max(startedAt + duration + pausedTime + addedTime, startedAt);
  // handle events that finish the day after
  const expectedFinish = startedAt + duration + pausedTime + addedTime;
  if (expectedFinish > dayInMs) {
    return expectedFinish - dayInMs;
  }

  // an event cannot finish before it started (user added too much negative time)
  return Math.max(expectedFinish, startedAt);
}

/**
 * Calculates running countdown
 */
export function getCurrent(
  startedAt: MaybeNumber,
  duration: number,
  addedTime: number,
  pausedTime: number,
  clock: number,
) {
  if (startedAt === null) {
    return null;
  }
  if (startedAt > clock) {
    return startedAt + duration + addedTime + pausedTime - clock - dayInMs;
  }
  return startedAt + duration + addedTime + pausedTime - clock;
}

/**
 * Calculates elapsed time
 */
export function getElapsed(startedAt: number, clock: number) {
  // we are in the day after
  if (startedAt > clock) {
    throw new Error('clock cannot be higher than startedAt');
    return dayInMs - startedAt + clock;
  }
  return clock - startedAt;
}
