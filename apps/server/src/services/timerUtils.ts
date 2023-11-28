import { MaybeNumber, TimerType } from 'ontime-types';
import { dayInMs } from 'ontime-utils';
import { config } from '../config/config.js';

/**
 * Calculates expected finish time of a running timer
 */
export function getExpectedFinish(
  startedAt: MaybeNumber,
  finishedAt: MaybeNumber,
  duration: number,
  pausedTime: number,
  addedTime: number,
  timeEnd: number,
  timerType: TimerType,
) {
  if (startedAt === null) {
    return null;
  }

  if (finishedAt !== null) {
    return finishedAt;
  }

  if (timerType === TimerType.TimeToEnd) {
    return timeEnd + addedTime + pausedTime;
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
  timeEnd: number,
  timerType: TimerType,
) {
  if (startedAt === null) {
    return null;
  }

  if (timerType === TimerType.TimeToEnd) {
    if (startedAt > timeEnd) {
      return timeEnd + addedTime + pausedTime + dayInMs - clock;
    }
    return timeEnd + addedTime + pausedTime - clock;
  }

  if (startedAt > clock) {
    // we are the day after the event was started
    return startedAt + duration + addedTime + pausedTime - clock - dayInMs;
  }
  return startedAt + duration + addedTime + pausedTime - clock;
}

export function skipedOutOfEvent(previousTime: number, clock: number, startedAt: number, expectedFinish): boolean {
  const skipTime = previousTime - clock;
  const hasSkipped = Math.abs(skipTime) > config.timeSkipLimit;
  if (hasSkipped) {
    if (clock > expectedFinish || clock < startedAt) {
      return true;
    }
    // otherwise we just skipped within the event
  }
  return false;
}
