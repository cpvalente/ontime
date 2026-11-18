import {
  Day,
  Duration,
  Instant,
  Maybe,
  Offset,
  OffsetMode,
  OntimeEvent,
  Playback,
  TimeOfDay,
  TimerPhase,
} from 'ontime-types';
import { MILLIS_PER_HOUR, dayInMs, getExpectedEnd, getExpectedStart, isPlaybackActive } from 'ontime-utils';

import * as timeCore from '../../lib/time-core/timeCore.js';
import type { RuntimeState } from '../../stores/runtimeState.js';

/**
 * handle events that span over midnight
 */
export const normaliseEndTime = (start: number, end: number) => (end < start ? end + dayInMs : end);

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
  epoch: Instant;
  event: Maybe<{ countToEnd: boolean; timeStart: TimeOfDay; dayOffset: Day }>;
  startedAt: Maybe<Instant>;
  duration: Maybe<Duration>;
  addedTime: Duration;
  pausedAt: Maybe<Instant>;
  rundownStartEpoch: Maybe<Instant>;
  startDayOffset: Maybe<Day>;
};

/**
 * Calculates expected finish time of a running timer
 * @returns time the timer should finish, or null if nothing is running
 */
export function getExpectedFinish(input: ExpectedFinishInput): Maybe<TimeOfDay> {
  const { event, startedAt, duration, addedTime, pausedAt, epoch, rundownStartEpoch, startDayOffset } = input;

  if (event === null) {
    return null;
  }

  if (startedAt === null) {
    return null;
  }

  const pausedTime = pausedAt !== null ? timeCore.timeSince(epoch, pausedAt) : (0 as Duration);

  if (event.countToEnd) {
    const { timeStart, dayOffset } = event;
    const start = toRundownInstant(timeStart, dayOffset, rundownStartEpoch ?? epoch, startDayOffset ?? dayOffset);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- duration exists if there is a timer
    const endEpoch = timeCore.addDuration(start, [duration!, addedTime, pausedTime]);
    return timeCore.toTimeOfDay(endEpoch);
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- duration exists if there is a timer
  const expectedFinish = timeCore.addDuration(startedAt, [duration!, addedTime, pausedTime]);

  // an event cannot finish before it started (user added too much negative time)
  return timeCore.toTimeOfDay(Math.max(expectedFinish, startedAt) as Instant);
}

export type CurrentInput = {
  epoch: Instant;
  event: { countToEnd: boolean; timeStart: TimeOfDay; dayOffset: Day };
  startedAt: Maybe<Instant>;
  duration: Duration;
  addedTime: Duration;
  pausedAt: Maybe<Instant>;
  rundownStartEpoch: Maybe<Instant>;
  startDayOffset: Maybe<Day>;
};

/**
 * Calculates running countdown
 * @returns time remaining in the timer, negative when in overtime
 */
export function getCurrent(input: CurrentInput): Duration {
  const { event, startedAt, duration, addedTime, pausedAt, epoch, rundownStartEpoch, startDayOffset } = input;
  const { countToEnd, timeStart, dayOffset } = event;

  if (countToEnd) {
    const start = toRundownInstant(timeStart, dayOffset, rundownStartEpoch ?? epoch, startDayOffset ?? dayOffset);
    const endEpoch = timeCore.addDuration(start, [duration, addedTime]);
    return timeCore.timeUntil(epoch, endEpoch);
  }

  if (startedAt === null) {
    return duration;
  }

  if (pausedAt != null) {
    return (duration + addedTime - timeCore.timeSince(pausedAt, startedAt)) as Duration;
  }

  return timeCore.timeUntil(epoch, timeCore.addDuration(startedAt, [duration, addedTime]));
}

export type ElapsedInput = {
  epoch: Instant;
  startedAt: Maybe<Instant>;
  pausedAt: Maybe<Instant>;
  /** time spent in pauses which have been resumed */
  pausedDuration: Duration;
};

/**
 * Calculates active time elapsed since the timer started.
 */
export function getElapsed(input: ElapsedInput): Maybe<Duration> {
  const { startedAt, pausedAt, pausedDuration, epoch } = input;

  if (startedAt === null) {
    return null;
  }

  const referenceClock = pausedAt ?? epoch;
  const elapsedSinceStart = timeCore.timeSince(referenceClock, startedAt);
  const activeElapsed = elapsedSinceStart - pausedDuration;

  return Math.max(0, activeElapsed) as Duration;
}

/**
 * Checks whether a jump in time took us out of the running event
 * @param state runtime state after the jump
 * @param previousEpoch instant of the previous update
 * @param skipLimit how much time can pass between updates before we consider it a skip
 */
export function skippedOutOfEvent(state: RuntimeState, previousEpoch: Instant, skipLimit: number): boolean {
  const { _epoch: epoch, _timer, timer } = state;
  // we cant have skipped if we haven't started
  if (_timer.startedAt === null || timer.current === null) {
    return false;
  }

  // current is the time left to the end, it is negative once we are past it
  const isInsideEvent = epoch >= _timer.startedAt && timer.current >= 0;
  if (isInsideEvent) return false;

  // we are outside the event, but we need to check if we skipped or just finished normally
  return Math.abs(timeCore.timeSince(epoch, previousEpoch)) > skipLimit;
}

export type RuntimeOffsetInput = {
  epoch: Instant;
  event: Maybe<{ countToEnd: boolean; timeStart: TimeOfDay; dayOffset: Day }>;
  startedAt: Maybe<Instant>;
  current: Maybe<Duration>;
  addedTime: Duration;
  pausedAt: Maybe<Instant>;
  /** day the rundown started on, relative to its first event */
  startDayOffset: Maybe<Day>;
  plannedStart: Maybe<TimeOfDay>;
  rundownStartEpoch: Maybe<Instant>;
};

/**
 * Calculates difference between the runtime and the schedule of an event
 * Positive offset is over time / behind schedule
 * Negative offset is under time / ahead of schedule
 */
export function getRuntimeOffset(input: RuntimeOffsetInput): { absolute: Duration; relative: Duration } {
  const { event, startedAt, current, addedTime, pausedAt, startDayOffset, plannedStart, rundownStartEpoch, epoch } =
    input;
  // nothing to calculate if there are no loaded events or if we haven't started
  if (event === null || startedAt === null || startDayOffset === null || rundownStartEpoch === null) {
    return { absolute: 0 as Duration, relative: 0 as Duration };
  }

  const { countToEnd, timeStart, dayOffset } = event;

  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    // we know current exists as long as eventNow exists
    if (current === null) throw new Error('timerUtils.getRuntimeOffset: current must be set');
    if (plannedStart === null) throw new Error('timerUtils.getRuntimeOffset: plannedStart must be set');
  }

  // difference between planned event start and actual event start (will be positive if we started behind)
  const expectedEventStart = toRundownInstant(timeStart, dayOffset, rundownStartEpoch, startDayOffset);
  const eventStartOffset = timeCore.timeSince(startedAt, expectedEventStart);

  // difference between planned rundown start and actual rundown start (will be positive if we started behind)
  const expectedRundownStart = toRundownInstant(plannedStart, 0 as Day, rundownStartEpoch, startDayOffset);
  const rundownStartOffset = timeCore.timeSince(rundownStartEpoch, expectedRundownStart);

  // how long has the event been running over (is a negative number when in over timer so inverted before adding to offset)
  const overtime = Math.abs(Math.min(current, 0));

  // time the playback was paused is added to the offset
  const pausedTime = pausedAt !== null ? timeCore.timeSince(epoch, pausedAt) : (0 as Duration);

  // absolute offset is difference between schedule and playback time
  // in case of count to end, the absolute offset is overtime and added time
  const absolute = countToEnd ? overtime + addedTime : eventStartOffset + overtime + pausedTime + addedTime;

  // the relative offset is the absolute offset, minus the delay the rundown started with
  const relative = absolute - rundownStartOffset;

  return { absolute: absolute as Duration, relative: relative as Duration };
}

/**
 * Resolves a planned time of day on a rundown day to an instant
 * - uses the day the rundown started on as reference
 * - anchors to noon so whole-day shifts land on the intended calendar day across DST changes
 */
function toRundownInstant(time: TimeOfDay, plannedDay: Day, rundownStartEpoch: Instant, startDayOffset: Day): Instant {
  const startDayNoon = timeCore.toInstant((12 * MILLIS_PER_HOUR) as TimeOfDay, rundownStartEpoch);
  const reference = timeCore.addDuration(startDayNoon, ((plannedDay - startDayOffset) * dayInMs) as Duration);
  return timeCore.toInstant(time, reference);
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
 * used by the runtimeState on first start to get correct offsets
 */
export function findDayOffset(plannedStart: number, clock: number): Day {
  const distance = clock - plannedStart;
  if (distance >= 12 * MILLIS_PER_HOUR) return -1 as Day;
  if (distance < -12 * MILLIS_PER_HOUR) return 1 as Day;
  return 0 as Day;
}
