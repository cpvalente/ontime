import { MaybeNumber, TimerPhase } from 'ontime-types';
import { dayInMs, isPlaybackActive } from 'ontime-utils';
import type { RuntimeState } from '../stores/runtimeState.js';

/**
 * handle events that span over midnight
 */
export const normaliseEndTime = (start: number, end: number) => (end < start ? end + dayInMs : end);

/**
 * Calculates expected finish time of a running timer
 * @param {RuntimeState} state runtime state
 * @returns {number | null} new current time or null if nothing is running
 */
export function getExpectedFinish(state: RuntimeState): MaybeNumber {
  const { startedAt, finishedAt, duration, addedTime } = state.timer;

  if (state.eventNow === null) {
    return null;
  }

  const { countToEnd, timeEnd } = state.eventNow;
  const { pausedAt } = state._timer;
  const { clock } = state;

  if (startedAt === null) {
    return null;
  }

  if (finishedAt !== null) {
    return finishedAt;
  }

  const pausedTime = pausedAt != null ? clock - pausedAt : 0;

  if (countToEnd) {
    return timeEnd + addedTime + pausedTime;
  }

  // handle events that finish the day after
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- duration exists if ther eis a timer
  const expectedFinish = startedAt + duration! + addedTime + pausedTime;
  if (expectedFinish > dayInMs) {
    return expectedFinish - dayInMs;
  }

  // an event cannot finish before it started (user added too much negative time)
  return Math.max(expectedFinish, startedAt);
}

/**
 * Calculates running countdown
 * @param {RuntimeState} state runtime state
 * @returns {number} current time for timer
 */

export function getCurrent(state: RuntimeState): number {
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (state.eventNow === null || state.timer.duration === null) {
      throw new Error('timerUtils.getCurrent: invalid state received');
    }
  }
  const { startedAt, duration, addedTime } = state.timer;
  const { countToEnd, timeStart, timeEnd } = state.eventNow;
  const { pausedAt } = state._timer;
  const { clock } = state;

  if (countToEnd) {
    const isEventOverMidnight = timeStart > timeEnd;
    const correctDay = isEventOverMidnight ? dayInMs : 0;
    return correctDay - clock + timeEnd + addedTime;
  }

  if (startedAt === null) {
    return duration;
  }

  if (pausedAt != null) {
    return startedAt + duration + addedTime - pausedAt;
  }

  const hasPassedMidnight = startedAt > clock;
  const correctDay = hasPassedMidnight ? dayInMs : 0;
  return startedAt + duration + addedTime - clock - correctDay;
}

/**
 * Checks whether we have skipped out of the event
 * @param {RuntimeState} state runtime state
 * @param {number} previousTime previous clock
 * @param {number} skipLimit how much time can we skip
 * @returns {boolean}
 */
export function skippedOutOfEvent(state: RuntimeState, previousTime: number, skipLimit: number): boolean {
  // we cant have skipped if we havent started
  if (state.timer.expectedFinish === null || state.timer.startedAt === null) {
    return false;
  }

  const { startedAt, expectedFinish } = state.timer;
  const { clock } = state;

  const hasPassedMidnight = previousTime > dayInMs - skipLimit && clock < skipLimit;
  const adjustedClock = hasPassedMidnight ? clock + dayInMs : clock;

  const timeDifference = previousTime - adjustedClock;
  const hasSkipped = Math.abs(timeDifference) > skipLimit;
  const adjustedExpectedFinish = expectedFinish >= startedAt ? expectedFinish : expectedFinish + dayInMs;

  return hasSkipped && (adjustedClock > adjustedExpectedFinish || adjustedClock < startedAt);
}

/**
 * Calculates difference between the runtime and the schedule of an event
 * Positive offset is time ahead
 * Negative offset is time delayed
 */
export function getRuntimeOffset(state: RuntimeState): { offsetAbs: number; offsetRel: number } {
  // nothing to calculate if there are no loaded events or if we havent started
  if (state.eventNow === null || state.runtime.actualStart === null) {
    return { offsetAbs: 0, offsetRel: 0 };
  }

  const { clock } = state;
  const { countToEnd, timeStart } = state.eventNow;
  const { addedTime, current, startedAt } = state.timer;
  const { actualStart, plannedStart } = state.runtime;

  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    // we know current exists as long as eventNow exists
    if (current === null) throw new Error('timerUtils.getRuntimeOffset: state.timer.current must be set');
    if (plannedStart === null) throw new Error('timerUtils.getRuntimeOffset: state.runtime.plannedStart must be set');
  }

  // if we havent started, but the timer is armed
  // the offset is the difference to the schedule
  if (startedAt === null) {
    return { offsetAbs: timeStart - clock, offsetRel: 0 };
  }

  const overtime = Math.min(current, 0);
  // in time-to-end, offset is overtime

  const startOffset = timeStart - startedAt;
  const pausedTime = state._timer.pausedAt === null ? 0 : clock - state._timer.pausedAt;

  // startOffset - difference between scheduled start and actual start
  // addedTime - time added by user (negative offset)
  // pausedTime - time the playback was paused (negative offset)
  // overtime - how long the timer has been over-running (negative offset)
  const offset = startOffset - addedTime - pausedTime + overtime;

  // offset between planned rundown start and actual rundown start
  const rundownStartOffset = actualStart - plannedStart;

  // offset offset relative to the actual rundown start
  const offsetRel = offset + rundownStartOffset;

  // in time-to-end, offset is overtime
  if (countToEnd) {
    return { offsetAbs: overtime, offsetRel };
  }

  return { offsetAbs: offset, offsetRel };
}

/**
 * Checks running timer to see which phase it currently is in
 * @param state
 */
export function getTimerPhase(state: RuntimeState): TimerPhase {
  if (!isPlaybackActive(state.timer.playback)) {
    return TimerPhase.None;
  }

  const current = state.timer.current;

  if (current === null || state.eventNow === null || state.timer.secondaryTimer != null) {
    return TimerPhase.Pending;
  }

  if (current < 0) {
    return TimerPhase.Overtime;
  }

  const danger = state.eventNow.timeDanger;
  if (current <= danger) {
    return TimerPhase.Danger;
  }

  const warning = state.eventNow.timeWarning;
  if (current <= warning) {
    return TimerPhase.Warning;
  }

  return TimerPhase.Default;
}
