import { MaybeNumber } from 'ontime-types';
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
