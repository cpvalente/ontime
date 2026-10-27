import {
  Day,
  Duration,
  Maybe,
  MaybeNumber,
  Offset,
  OffsetMode,
  OntimeEvent,
  Playback,
  TimeOfDay,
  TimerPhase,
} from 'ontime-types';
import { MILLIS_PER_HOUR, checkIsNow, dayInMs, getExpectedEnd, getExpectedStart, isPlaybackActive } from 'ontime-utils';

import * as timeCore from '../../lib/time-core/timeCore.js';
import type { RuntimeState } from '../../stores/runtimeState.js';

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

export type TimeToBoundaryInput = {
  playback: Playback;
  current: Maybe<Duration>;
  secondaryTimer: Maybe<Duration>;
  hasFinished: boolean;
  /** how far ahead of its end we resolve a running timer */
  triggerAhead: Duration;
};

/**
 * Calculates how long until the next playback boundary the timer must resolve
 * ie: the end of a roll pre-roll wait or the (anticipated) end of the running event
 * @returns time until the boundary, or null if there is none to anticipate
 */
export function getTimeToBoundary(input: TimeToBoundaryInput): Maybe<Duration> {
  const { playback, current, secondaryTimer, hasFinished, triggerAhead } = input;

  if (playback !== Playback.Play && playback !== Playback.Roll) {
    return null;
  }

  // waiting to roll into the next event
  if (playback === Playback.Roll && secondaryTimer !== null) {
    return secondaryTimer;
  }

  if (current === null || hasFinished) {
    return null;
  }

  return (current - triggerAhead) as Duration;
}

export type ExpectedFinishInput = {
  clock: TimeOfDay;
  event: Maybe<{ countToEnd: boolean; timeEnd: TimeOfDay }>;
  startedAt: Maybe<TimeOfDay>;
  duration: Maybe<Duration>;
  addedTime: Duration;
  pausedAt: Maybe<TimeOfDay>;
};

/**
 * Calculates expected finish time of a running timer
 * @returns time the timer should finish, or null if nothing is running
 * not wrapped to a time of day for count to end events
 */
export function getExpectedFinish(input: ExpectedFinishInput): MaybeNumber {
  const { clock, event, startedAt, duration, addedTime, pausedAt } = input;

  if (event === null) {
    return null;
  }

  if (startedAt === null) {
    return null;
  }

  const pausedTime = pausedAt != null ? timeCore.elapsedTime(clock, pausedAt) : 0;

  if (event.countToEnd) {
    return event.timeEnd + addedTime + pausedTime;
  }

  // handle events that finish the day after
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- duration exists if there is a timer
  const expectedFinish = startedAt + duration! + addedTime + pausedTime;
  if (expectedFinish > dayInMs) {
    return expectedFinish - dayInMs;
  }

  // an event cannot finish before it started (user added too much negative time)
  return Math.max(expectedFinish, startedAt);
}

export type CurrentInput = {
  clock: TimeOfDay;
  event: { countToEnd: boolean; timeStart: TimeOfDay; timeEnd: TimeOfDay };
  startedAt: Maybe<TimeOfDay>;
  duration: Duration;
  addedTime: Duration;
  pausedAt: Maybe<TimeOfDay>;
};

/**
 * Calculates running countdown
 * @returns time remaining in the timer, negative when in overtime
 */
export function getCurrent(input: CurrentInput): Duration {
  const { clock, event, startedAt, duration, addedTime, pausedAt } = input;
  const { countToEnd, timeStart, timeEnd } = event;

  if (countToEnd) {
    const isEventOverMidnight = timeStart > timeEnd;
    const correctDay = isEventOverMidnight ? dayInMs : 0;
    return (correctDay - clock + timeEnd + addedTime) as Duration;
  }

  if (startedAt === null) {
    return duration;
  }

  if (pausedAt != null) {
    return (duration + addedTime - timeCore.elapsedTime(pausedAt, startedAt)) as Duration;
  }

  const hasPassedMidnight = startedAt > clock;
  const correctDay = hasPassedMidnight ? dayInMs : 0;
  return (startedAt + duration + addedTime - clock - correctDay) as Duration;
}

export type ElapsedInput = {
  clock: TimeOfDay;
  startedAt: Maybe<TimeOfDay>;
  pausedAt: Maybe<TimeOfDay>;
  /** time spent in pauses which have been resumed */
  pausedDuration: Duration;
};

/**
 * Calculates active time elapsed since the timer started.
 */
export function getElapsed(input: ElapsedInput): Maybe<Duration> {
  const { clock, startedAt, pausedAt, pausedDuration } = input;

  if (startedAt === null) {
    return null;
  }

  const referenceClock = pausedAt ?? clock;
  const elapsedSinceStart = timeCore.elapsedTime(referenceClock, startedAt);
  const activeElapsed = elapsedSinceStart - pausedDuration;

  return Math.max(0, activeElapsed) as Duration;
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

export type RuntimeOffsetInput = {
  clock: TimeOfDay;
  event: Maybe<{ countToEnd: boolean; timeStart: TimeOfDay; dayOffset: Day }>;
  startedAt: Maybe<TimeOfDay>;
  current: Maybe<Duration>;
  addedTime: Duration;
  pausedAt: Maybe<TimeOfDay>;
  /** day the rundown started on, relative to its first event */
  startDayOffset: Maybe<Day>;
  plannedStart: Maybe<TimeOfDay>;
  actualStart: Maybe<TimeOfDay>;
};

/**
 * Calculates difference between the runtime and the schedule of an event
 * Positive offset is over time / behind schedule
 * Negative offset is under time / ahead of schedule
 */
export function getRuntimeOffset(input: RuntimeOffsetInput): { absolute: Duration; relative: Duration } {
  const { clock, event, startedAt, current, addedTime, pausedAt, startDayOffset, plannedStart, actualStart } = input;
  // nothing to calculate if there are no loaded events or if we havent started
  if (event === null || startedAt === null || startDayOffset === null) {
    return { absolute: 0 as Duration, relative: 0 as Duration };
  }

  const { countToEnd, timeStart, dayOffset } = event;

  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    // we know current exists as long as eventNow exists
    if (current === null) throw new Error('timerUtils.getRuntimeOffset: current must be set');
    if (plannedStart === null) throw new Error('timerUtils.getRuntimeOffset: plannedStart must be set');
    if (actualStart === null) throw new Error('timerUtils.getRuntimeOffset: actualStart must be set');
  }

  // difference between planned event start and actual event start (will be positive if we started behind)
  const eventStartOffset = startedAt + startDayOffset * dayInMs - (timeStart + dayOffset * dayInMs);

  // how long has the event been running over (is a negative number when in over timer so inverted before adding to offset)
  const overtime = Math.abs(Math.min(current, 0));

  // time the playback was paused is added to the offset
  const pausedTime = pausedAt === null ? 0 : timeCore.elapsedTime(clock, pausedAt);

  // absolute offset is difference between schedule and playback time
  // in case of count to end, the absolute offset is overtime and added time
  const absolute = countToEnd ? overtime + addedTime : eventStartOffset + overtime + pausedTime + addedTime;

  // the relative offset is the same as the absolute but adjusted relative to the actual start time
  const relative = absolute + plannedStart - actualStart - startDayOffset * dayInMs;

  return { absolute: absolute as Duration, relative: relative as Duration };
}

export type TimerPhaseInput = {
  playback: Playback;
  current: Maybe<Duration>;
  secondaryTimer: Maybe<Duration>;
  event: Maybe<{ timeDanger: Duration; timeWarning: Duration }>;
};

/**
 * Checks running timer to see which phase it currently is in
 */
export function getTimerPhase(input: TimerPhaseInput): TimerPhase {
  const { playback, current, secondaryTimer, event } = input;

  if (!isPlaybackActive(playback)) {
    return TimerPhase.None;
  }

  if (current === null || event === null || secondaryTimer != null) {
    return TimerPhase.Pending;
  }

  if (current < 0) {
    return TimerPhase.Overtime;
  }

  if (current <= event.timeDanger) {
    return TimerPhase.Danger;
  }

  if (current <= event.timeWarning) {
    return TimerPhase.Warning;
  }

  return TimerPhase.Default;
}

/** An event after the loaded one, with what is needed to calculate when it is expected */
export type ExpectedMetadata = {
  event: OntimeEvent;
  accumulatedGap: number;
  isLinkedToLoaded: boolean;
};

export type ExpectedTimesInput = {
  mode: OffsetMode;
  offset: { absolute: Duration; relative: Duration };
  plannedStart: Maybe<TimeOfDay>;
  actualStart: Maybe<TimeOfDay>;
  currentDay: Day;
  group: Maybe<ExpectedMetadata>;
  flag: Maybe<ExpectedMetadata>;
  end: Maybe<ExpectedMetadata>;
};

/**
 * Calculates when the current group ends, the next flag starts and the rundown ends
 */
export function getExpectedTimes(
  input: ExpectedTimesInput,
): Pick<Offset, 'expectedGroupEnd' | 'expectedFlagStart' | 'expectedRundownEnd'> {
  const { mode, offset, plannedStart, actualStart, currentDay, group, flag, end } = input;

  const getLookaheadStart = ({ event, accumulatedGap, isLinkedToLoaded }: ExpectedMetadata) =>
    getExpectedStart(event, {
      currentDay,
      mode,
      offset: mode === OffsetMode.Absolute ? offset.absolute : offset.relative,
      plannedStart,
      actualStart,
      totalGap: accumulatedGap,
      isLinkedToLoaded,
    });

  return {
    expectedGroupEnd: group === null ? null : getExpectedEnd(group.event, getLookaheadStart(group), currentDay),
    expectedFlagStart: flag === null ? null : getLookaheadStart(flag),
    expectedRundownEnd: end === null ? null : getExpectedEnd(end.event, getLookaheadStart(end), currentDay),
  };
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
