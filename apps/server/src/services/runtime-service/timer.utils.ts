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
import {
  MILLIS_PER_HOUR,
  checkIsNow,
  dayInMs,
  getDelayedStart,
  getExpectedEnd,
  getExpectedStart,
  isPlaybackActive,
} from 'ontime-utils';

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
  event: Maybe<{ countToEnd: boolean; timeEnd: TimeOfDay }>;
  startedAt: Maybe<TimeOfDay>;
  duration: Maybe<Duration>;
  addedTime: Duration;
  /** time spent in the ongoing pause */
  pausedTime: Duration;
};

/**
 * Calculates expected finish time of a running timer
 * @returns time the timer should finish, or null if nothing is running
 * not wrapped to a time of day for count to end events
 */
export function getExpectedFinish(input: ExpectedFinishInput): MaybeNumber {
  const { event, startedAt, duration, addedTime, pausedTime } = input;

  if (event === null) {
    return null;
  }

  if (startedAt === null) {
    return null;
  }

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
  event: { countToEnd: boolean; timeStart: TimeOfDay; dayOffset: Day };
  /** day of the rundown we are in, null before the rundown starts */
  currentDay: Maybe<Day>;
  /** wall clock time from the start to the ongoing pause, or to now when running; null before the start */
  sinceStart: Maybe<Duration>;
  duration: Duration;
  addedTime: Duration;
  /** time spent in the ongoing pause */
  pausedTime: Duration;
};

/**
 * Calculates running countdown
 * @returns time remaining in the timer, negative when in overtime
 */
export function getCurrent(input: CurrentInput): Duration {
  const { clock, event, currentDay, sinceStart, duration, addedTime, pausedTime } = input;
  const { countToEnd, timeStart, dayOffset } = event;

  if (countToEnd) {
    // the planned end and the clock, both counted from the first day of the rundown
    const plannedEnd = dayOffset * dayInMs + timeStart + duration;
    const clockInRundown = (currentDay ?? dayOffset) * dayInMs + clock;
    // time paused gives the event time, as added time does
    return (plannedEnd + addedTime + pausedTime - clockInRundown) as Duration;
  }

  if (sinceStart === null) {
    return duration;
  }

  return (duration + addedTime - sinceStart) as Duration;
}

export type ElapsedInput = {
  /** wall clock time from the start to the ongoing pause, or to now when running; null before the start */
  sinceStart: Maybe<Duration>;
  /** time spent in pauses which have been resumed */
  pausedDuration: Duration;
};

/**
 * Calculates active time elapsed since the timer started.
 */
export function getElapsed(input: ElapsedInput): Maybe<Duration> {
  const { sinceStart, pausedDuration } = input;

  if (sinceStart === null) {
    return null;
  }

  const activeElapsed = sinceStart - pausedDuration;

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
  /** the delay the offset is measured from, see docs/agent-guides/domain-invariants.md#delays */
  event: Maybe<{ countToEnd: boolean; timeStart: TimeOfDay; dayOffset: Day; delay: Duration }>;
  startedAt: Maybe<TimeOfDay>;
  current: Maybe<Duration>;
  addedTime: Duration;
  /** time spent in the ongoing pause */
  pausedTime: Duration;
  /** day playback started on, relative to the rundown's first event */
  startDayOffset: Maybe<Day>;
  /** delayed start of the event playback started from */
  startEventStart: Maybe<TimeOfDay>;
  /** rundown day of the event playback started from */
  startEventDay: Maybe<Day>;
  actualStart: Maybe<TimeOfDay>;
};

/**
 * Calculates difference between the runtime and the schedule of an event
 * The schedule is the delayed one: a delay is part of the plan, so it is never counted twice
 * Positive offset is over time / behind schedule
 * Negative offset is under time / ahead of schedule
 */
export function getRuntimeOffset(input: RuntimeOffsetInput): { absolute: Duration; relative: Duration } {
  const {
    event,
    startedAt,
    current,
    addedTime,
    pausedTime,
    startDayOffset,
    startEventStart,
    startEventDay,
    actualStart,
  } = input;
  // nothing to calculate if there are no loaded events or if we havent started
  if (event === null || startedAt === null || startDayOffset === null) {
    return { absolute: 0 as Duration, relative: 0 as Duration };
  }

  const { countToEnd, dayOffset } = event;

  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    // we know current exists as long as eventNow exists
    if (current === null) throw new Error('timerUtils.getRuntimeOffset: current must be set');
    if (startEventStart === null || startEventDay === null)
      throw new Error('timerUtils.getRuntimeOffset: the start event must be set');
    if (actualStart === null) throw new Error('timerUtils.getRuntimeOffset: actualStart must be set');
  }

  // difference between delayed event start and actual event start (will be positive if we started behind)
  const eventStartOffset = startedAt + startDayOffset * dayInMs - (getDelayedStart(event) + dayOffset * dayInMs);

  // how long has the event been running over (is a negative number when in over timer so inverted before adding to offset)
  const overtime = Math.abs(Math.min(current, 0));

  // time the playback was paused is added to the offset
  // absolute offset is difference between schedule and playback time
  // in case of count to end, the absolute offset is overtime and the time given to the event
  const absolute = countToEnd
    ? overtime + pausedTime + addedTime
    : eventStartOffset + overtime + pausedTime + addedTime;

  // the relative offset discounts how late or early playback started, compared to the event it started from
  const startShift = (actualStart + startDayOffset * dayInMs - (startEventStart + startEventDay * dayInMs)) as Duration;
  const relative = absolute - startShift;

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
  isLoaded: boolean;
};

export type ExpectedTimesInput = {
  mode: OffsetMode;
  offset: { absolute: Duration; relative: Duration };
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
  const { mode, offset, currentDay, group, flag, end } = input;

  const getLookaheadStart = ({ event, accumulatedGap, isLinkedToLoaded }: ExpectedMetadata) =>
    getExpectedStart(event, {
      currentDay,
      mode,
      offset: mode === OffsetMode.Absolute ? offset.absolute : offset.relative,
      startShift: (offset.absolute - offset.relative) as Duration,
      totalGap: accumulatedGap,
      isLinkedToLoaded,
    });

  return {
    expectedGroupEnd:
      group === null ? null : getExpectedEnd(group.event, getLookaheadStart(group), currentDay, group.isLoaded),
    expectedFlagStart: flag === null ? null : getLookaheadStart(flag),
    expectedRundownEnd:
      end === null ? null : getExpectedEnd(end.event, getLookaheadStart(end), currentDay, end.isLoaded),
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
