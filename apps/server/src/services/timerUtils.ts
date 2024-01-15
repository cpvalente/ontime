import { MaybeNumber, TimerType } from 'ontime-types';
import { dayInMs } from 'ontime-utils';
import { TState } from '../state.js';

/**
 * Calculates expected finish time of a running timer
 * @param {TState} state runtime state
 * @returns {number | null} new current time or null if nothing is running
 */
export function getExpectedFinish(state: TState): MaybeNumber {
  const { startedAt, clock, finishedAt, duration, addedTime, timerType, pausedAt } = state.timer;
  const { timeEnd } = state.eventNow;

  if (startedAt === null) {
    return null;
  }

  if (finishedAt !== null) {
    return finishedAt;
  }

  const pausedTime = pausedAt !== null ? clock - pausedAt : 0;

  if (timerType === TimerType.TimeToEnd) {
    return timeEnd + addedTime + pausedTime;
  }

  // handle events that finish the day after
  const expectedFinish = startedAt + duration + addedTime + pausedTime;
  if (expectedFinish > dayInMs) {
    return expectedFinish - dayInMs;
  }

  // an event cannot finish before it started (user added too much negative time)
  return Math.max(expectedFinish, startedAt);
}

/**
 * Calculates running countdown
 * @param {TState} state runtime state
 * @returns {number} current time for timer
 */
export function getCurrent(state: TState): number {
  const { startedAt, duration, addedTime, clock, timerType, pausedAt } = state.timer;
  const { timeEnd } = state.eventNow;

  if (timerType === TimerType.TimeToEnd) {
    const isNextDay = startedAt > timeEnd;
    const correctDay = isNextDay ? dayInMs : 0;
    return timeEnd + addedTime + correctDay - clock;
  }

  if (startedAt === null) {
    return duration;
  }

  const hasPassedMidnight = startedAt > clock;
  const correctDay = hasPassedMidnight ? dayInMs : 0;
  if (pausedAt !== null) {
    return startedAt + duration + addedTime - pausedAt;
  }

  return startedAt + duration + addedTime - clock - correctDay;
}

/**
 * Checks whether we have skipped out of the event
 * @param {TState} state runtime state
 * @param {number} previousTime previous clock
 * @param {number} skipLimit how much time can we skip
 * @returns {boolean}
 */
export function skippedOutOfEvent(state: TState, previousTime: number, skipLimit: number): boolean {
  const { clock, startedAt, expectedFinish } = state.timer;
  const hasPassedMidnight = previousTime > dayInMs - skipLimit && clock < skipLimit;
  const adjustedClock = hasPassedMidnight ? clock + dayInMs : clock;

  const timeDifference = previousTime - adjustedClock;
  const hasSkipped = Math.abs(timeDifference) > skipLimit;
  const adjustedExpectedFinish = expectedFinish >= startedAt ? expectedFinish : expectedFinish + dayInMs;

  return hasSkipped && (adjustedClock > adjustedExpectedFinish || adjustedClock < startedAt);
}
