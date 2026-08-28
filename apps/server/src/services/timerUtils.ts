import { Day, Duration, Maybe, MaybeNumber, TimeOfDay, TimerPhase } from 'ontime-types';
import { MILLIS_PER_HOUR, checkIsNow, dayInMs, isPlaybackActive } from 'ontime-utils';

import * as timeCore from '../lib/time-core/timeCore.js';
import type { RuntimeState } from '../stores/runtimeState.js';

/**
 * handle events that span over midnight
 */
export const normaliseEndTime = (start: number, end: number) => (end < start ? end + dayInMs : end);

/**
 * Checks whether the local wall clock wrapped into a new day
 * Uses a threshold to distinguish midnight wrap (~23h backward jump)
 * from DST fall back (~1h backward jump)
 */
export function hasCrossedMidnight(previous: TimeOfDay, current: TimeOfDay): boolean {
  const backwardJump = previous - current;
  return backwardJump > 12 * MILLIS_PER_HOUR;
}

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

  if (startedAt === null) {
    return null;
  }

  const pausedTime = getOngoingPauseDuration(state);

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
 * The result is a duration (time left in the timer), never a point in time
 * @param {RuntimeState} state runtime state
 * @returns {Duration} time remaining in the running timer
 */
export function getCurrent(state: RuntimeState): Duration {
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (state.eventNow === null || state.timer.duration === null) {
      throw new Error('timerUtils.getCurrent: invalid state received');
    }
  }
  const { startedAt, duration, addedTime } = state.timer;
  const { countToEnd, timeStart, timeEnd } = state.eventNow;
  const { clock } = state;

  if (countToEnd) {
    const isEventOverMidnight = timeStart > timeEnd;
    const correctDay = isEventOverMidnight ? dayInMs : 0;
    return (correctDay - clock + timeEnd + addedTime) as Duration;
  }

  if (startedAt === null) {
    return duration as Duration;
  }

  // an ongoing pause freezes the timer, so we discount the time spent in it
  const pausedTime = getOngoingPauseDuration(state);
  const elapsedSinceStart = timeCore.elapsedTime(clock, startedAt as TimeOfDay);

  return (duration + addedTime - elapsedSinceStart + pausedTime) as Duration;
}

/**
 * Calculates active time elapsed since the timer started
 * Time spent paused is not active time, so it is discounted
 */
export function getElapsed(state: RuntimeState): Maybe<Duration> {
  const { clock } = state;
  const { startedAt } = state.timer;
  const { pausedDuration } = state._timer;

  if (startedAt === null) {
    return null;
  }

  const elapsedSinceStart = timeCore.elapsedTime(clock, startedAt as TimeOfDay);
  const activeElapsed = elapsedSinceStart - pausedDuration - getOngoingPauseDuration(state);

  return Math.max(0, activeElapsed) as Duration;
}

/**
 * Calculates how long the current pause has been going on for
 * The pause is tracked as an instant, which makes the calculation
 * immune to the clock wrapping around midnight
 * @returns 0 if the playback is not paused
 */
function getOngoingPauseDuration(state: RuntimeState): Duration {
  const { pausedAt } = state._timer;

  if (pausedAt == null) {
    return 0 as Duration;
  }

  return timeCore.timeSince(state._now, pausedAt);
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

  const isInsideEvent = checkIsNow(startedAt, expectedFinish, clock);
  if (isInsideEvent) return false;

  // we are outside the event, but we need to check if we skipped or just finished normally
  const timeFromPrevious = Math.abs(previousTime - clock);
  // account for midnight when checking skips
  const hasSkipped = Math.min(timeFromPrevious, dayInMs - timeFromPrevious) > skipLimit;

  return hasSkipped;
}

/**
 * Calculates difference between the runtime and the schedule of an event
 * Positive offset is over time / behind schedule
 * Negative offset is under time / ahead of schedule
 */
export function getRuntimeOffset(state: RuntimeState): { absolute: number; relative: number } {
  const { eventNow, _startDayOffset } = state;
  const { addedTime, current, startedAt } = state.timer;
  // nothing to calculate if there are no loaded events or if we havent started
  if (eventNow === null || startedAt === null || _startDayOffset === null) {
    return { absolute: 0, relative: 0 };
  }

  const { countToEnd, timeStart, dayOffset } = eventNow;
  const { plannedStart, actualStart } = state.rundown;

  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    // we know current exists as long as eventNow exists
    if (current === null) throw new Error('timerUtils.getRuntimeOffset: state.timer.current must be set');
    if (plannedStart === null) throw new Error('timerUtils.getRuntimeOffset: state.rundown.plannedStart must be set');
    if (actualStart === null) throw new Error('timerUtils.getRuntimeOffset: state.rundown.plannedStart must be set');
  }

  // difference between planned event start and actual event start (will be positive if we started behind)
  const eventStartOffset = startedAt + _startDayOffset * dayInMs - (timeStart + dayOffset * dayInMs);

  // how long has the event been running over (is a negative number when in over timer so inverted before adding to offset)
  const overtime = Math.abs(Math.min(current, 0));

  // time the playback was paused, the difference from now to when we paused is added to the offset
  const pausedTime = getOngoingPauseDuration(state);

  // absolute offset is difference between schedule and playback time
  // in case of count to end, the absolute offset is overtime and added time
  const absolute = countToEnd ? overtime + addedTime : eventStartOffset + overtime + pausedTime + addedTime;

  // the relative offset is the same as the absolute but adjusted relative to the actual start time
  const relative = absolute + plannedStart - actualStart - _startDayOffset * dayInMs;

  return { absolute, relative };
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

/**
 * Finds the day offset relative to an event start
 * used byt the runtimeState on first start to get correct offsets
 */
export function findDayOffset(plannedStart: number, clock: number): Day {
  const distance = clock - plannedStart;
  if (distance >= 12 * MILLIS_PER_HOUR) return -1 as Day;
  if (distance < -12 * MILLIS_PER_HOUR) return 1 as Day;
  return 0 as Day;
}
