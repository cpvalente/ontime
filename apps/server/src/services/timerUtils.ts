import { Day, Duration, Maybe, TimeOfDay, TimerPhase } from 'ontime-types';
import { MILLIS_PER_HOUR, checkIsNow, dayInMs, isPlaybackActive } from 'ontime-utils';

import * as timeCore from '../lib/time-core/timeCore.js';
import { ZERO_DURATION } from '../lib/time-core/timeCore.js';
import type { InternalRuntimeState, RuntimeState } from '../stores/runtimeState.js';

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
 * @param {InternalRuntimeState} state runtime state
 * @returns {number | null} new current time or null if nothing is running
 */
export function getExpectedFinish(state: InternalRuntimeState): Maybe<TimeOfDay> {
  const { startedAt, duration, addedTime } = state.timer;
  if (state.eventNow === null) {
    return null;
  }

  const { countToEnd, timeEnd } = state.eventNow;
  const { pausedAt } = state._timer;
  const { _now } = state;

  if (startedAt === null) {
    return null;
  }

  const pausedTime = pausedAt !== null ? timeCore.toTimeOfDay(_now) - pausedAt : 0;
  if (countToEnd) {
    return (timeEnd + addedTime + pausedTime) as TimeOfDay;
  }

  // handle events that finish the day after
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- duration exists if there is a timer
  const expectedFinish = timeCore.toTimeOfDay(startedAt) + duration! + addedTime + pausedTime;

  if (expectedFinish > dayInMs) {
    return (expectedFinish - dayInMs) as TimeOfDay;
  }

  // an event cannot finish before it started (user added too much negative time)
  return Math.max(expectedFinish, timeCore.toTimeOfDay(startedAt)) as TimeOfDay;
}

/**
 * Calculates running countdown
 * @param {InternalRuntimeState} state runtime state
 * @returns {number} current time for timer
 */
export function getCurrent(state: InternalRuntimeState): Duration {
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (state.eventNow === null || state.timer.duration === null) {
      throw new Error('timerUtils.getCurrent: invalid state received');
    }
  }
  const { startedAt, duration, addedTime } = state.timer;
  const { countToEnd, timeStart, timeEnd } = state.eventNow;
  const { pausedAt } = state._timer;
  const { _now } = state;

  if (countToEnd) {
    const isEventOverMidnight = timeStart > timeEnd;
    const correctDay = isEventOverMidnight ? dayInMs : 0;
    return (correctDay - timeCore.toTimeOfDay(_now) + timeEnd + addedTime) as Duration;
  }

  if (startedAt === null) {
    return duration;
  }

  if (pausedAt != null) {
    return (timeCore.toTimeOfDay(startedAt) + duration + addedTime - pausedAt) as Duration;
  }

  const hasPassedMidnight = timeCore.toTimeOfDay(startedAt) > timeCore.toTimeOfDay(_now);
  const correctDay = hasPassedMidnight ? dayInMs : 0;
  return (timeCore.toTimeOfDay(startedAt) + duration + addedTime - timeCore.toTimeOfDay(_now) - correctDay) as Duration;
}

/**
 * Calculates active time elapsed since the timer started.
 */
export function getElapsed(state: InternalRuntimeState): Maybe<Duration> {
  const { _now } = state;
  const { startedAt } = state.timer;
  const { pausedAt, pausedDuration } = state._timer;

  if (startedAt === null) {
    return null;
  }

  const referenceClock = pausedAt ?? timeCore.toTimeOfDay(_now);
  const elapsedSinceStart = getTimeSinceStart(referenceClock, timeCore.toTimeOfDay(startedAt));
  const activeElapsed = elapsedSinceStart - pausedDuration;

  return Math.max(0, activeElapsed) as Duration;
}

function getTimeSinceStart(clock: TimeOfDay, startedAt: number): number {
  if (clock < startedAt) {
    return clock + dayInMs - startedAt;
  }

  return clock - startedAt;
}

/**
 * Checks whether we have skipped out of the event
 * @param {RuntimeState} state runtime state
 * @param {number} previousTime previous clock
 * @param {number} skipLimit how much time can we skip
 * @returns {boolean}
 */
export function skippedOutOfEvent(state: RuntimeState, previousTime: number, skipLimit: number): boolean {
  // we cant have skipped if we haven't started
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
export function getRuntimeOffset(state: InternalRuntimeState): { absolute: Duration; relative: Duration } {
  const { eventNow, _now, _startDayOffset } = state;
  const { addedTime, current, startedAt } = state.timer;
  // nothing to calculate if there are no loaded events or if we havent started
  if (eventNow === null || startedAt === null || _startDayOffset === null) {
    return { absolute: ZERO_DURATION, relative: ZERO_DURATION };
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
  const eventStartOffset =
    timeCore.toTimeOfDay(startedAt) + _startDayOffset * dayInMs - (timeStart + dayOffset * dayInMs);

  // how long has the event been running over (is a negative number when in over timer so inverted before adding to offset)
  const overtime = Math.abs(Math.min(current, 0));

  // time the playback was paused, the different from now to when we paused is added to the offset TODO: brakes when crossing midnight
  const pausedTime = state._timer.pausedAt === null ? 0 : timeCore.toTimeOfDay(_now) - state._timer.pausedAt;

  // absolute offset is difference between schedule and playback time
  // in case of count to end, the absolute offset is overtime and added time
  const absolute = (
    countToEnd ? overtime + addedTime : eventStartOffset + overtime + pausedTime + addedTime
  ) as Duration;

  // the relative offset is the same as the absolute but adjusted relative to the actual start time
  const relative = (absolute + plannedStart - actualStart - _startDayOffset * dayInMs) as Duration;

  return { absolute, relative };
}

/**
 * Checks running timer to see which phase it currently is in
 * @param state
 */
export function getTimerPhase(state: InternalRuntimeState): TimerPhase {
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
 * used by the RuntimeState on first start to get correct offsets
 */
export function findDayOffset(plannedStart: number, clock: number): Day {
  const distance = clock - plannedStart;
  if (distance >= 12 * MILLIS_PER_HOUR) return -1 as Day;
  if (distance < -12 * MILLIS_PER_HOUR) return 1 as Day;
  return 0 as Day;
}
