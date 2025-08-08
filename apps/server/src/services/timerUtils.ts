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
  const { startedAt, duration, addedTime } = state.timer;

  if (state.eventNow === null) {
    return null;
  }

  const { countToEnd, timeEnd } = state.eventNow;
  const { pausedAt } = state._timer;
  const { clock } = state;

  if (startedAt === null) {
    return null;
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
  const { eventNow, clock } = state;
  const { addedTime, current, startedAt } = state.timer;
  // nothing to calculate if there are no loaded events or if we havent started
  if (eventNow === null || startedAt === null) {
    return { offsetAbs: 0, offsetRel: 0 };
  }

  const { countToEnd, timeStart } = eventNow;
  const { plannedStart, actualStart } = state.runtime;

  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    // we know current exists as long as eventNow exists
    if (current === null) throw new Error('timerUtils.getRuntimeOffset: state.timer.current must be set');
    if (plannedStart === null) throw new Error('timerUtils.getRuntimeOffset: state.runtime.plannedStart must be set');
    if (actualStart === null) throw new Error('timerUtils.getRuntimeOffset: state.runtime.actualStart must be set');
  }

  // difference between planned event start and actual event start (will be positive if we stared behind )
  const eventStartOffset = startedAt - timeStart;

  // how long has the event been running over (is a negative number when in over timer so inverted before adding to offset)
  const overtime = Math.abs(Math.min(current, 0));

  // time the playback was paused, the different from now to when we paused is added to the offset TODO: brakes when crossing midnight
  const pausedTime = state._timer.pausedAt === null ? 0 : clock - state._timer.pausedAt;

  const offsetAbs = eventStartOffset + overtime + pausedTime + addedTime;

  // the relative offset i the same as the absolute offset but adjusted relative to the actual start time
  const offsetRel = offsetAbs + plannedStart - actualStart;

  // in case of count to end, the absolute offset is just the overtime
  return countToEnd ? { offsetAbs: overtime, offsetRel } : { offsetAbs, offsetRel };
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
