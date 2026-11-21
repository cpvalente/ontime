import {
  Day,
  Duration,
  Instant,
  Maybe,
  MaybeNumber,
  MaybeString,
  Offset,
  OntimeEvent,
  OntimeGroup,
  PhaseThresholds,
  PlayableEvent,
  Playback,
  Rundown,
  RundownState,
  TimeOfDay,
  TimerPhase,
  TimerState,
  runtimeStorePlaceholder,
} from 'ontime-types';
import {
  type LinkToLoaded,
  calculateDuration,
  checkIsNow,
  dayInMs,
  defaultPhaseThresholds,
  getDelayedStart,
  getLastEventNormal,
  getLinksToLoaded,
  isPlaybackActive,
  resolvePhaseThresholds,
} from 'ontime-utils';

import { RundownMetadata } from '../api-data/rundown/rundown.types.js';
import { getPlayableIndexFromTimedIndex } from '../api-data/rundown/rundown.utils.js';
import * as timeCore from '../lib/time-core/timeCore.js';
import type { RuntimeRestore } from '../services/restore-service/restore.types.js';
import { findNextRollEvent, loadRoll, normaliseRollStart } from '../services/runtime-service/roll.utils.js';
import {
  type CurrentInput,
  type ElapsedInput,
  type ExpectedFinishInput,
  type ExpectedMetadata,
  type RuntimeOffsetInput,
  type TimerPhaseInput,
  findDayOffset,
  getCurrent,
  getElapsed,
  getExpectedFinish,
  getExpectedTimes,
  getRuntimeOffset,
  getTimeToBoundary,
  getTimerPhase,
  hasCrossedMidnight,
} from '../services/runtime-service/timer.utils.js';
import { timerConfig } from '../setup/config.js';

export type RuntimeState = {
  clock: TimeOfDay;
  /** instant of the last clock update, clock is its time of day */
  _now: Instant;
  groupNow: OntimeGroup | null;
  eventNow: PlayableEvent | null;
  eventNext: PlayableEvent | null;
  eventFlag: PlayableEvent | null;
  offset: Offset;
  timer: TimerState;
  rundown: RundownState;
  // private properties of the timer calculations
  _timer: {
    forceFinish: Maybe<Instant>; // whether we should declare an event as finished, will contain the finish time
    /** when the loaded event started, timer.startedAt is its time of day */
    startedAt: Maybe<Instant>;
    pausedAt: Maybe<Instant>;
    /** time spent in pauses which have been resumed */
    pausedDuration: Duration;
    secondaryTarget: Maybe<TimeOfDay>;
    hasFinished: boolean;
  };
  _rundown: {
    totalDelay: number; // this value comes from rundown service
  };
  _group: Maybe<ExpectedMetadata>;
  _flag: Maybe<ExpectedMetadata>;
  _end: Maybe<ExpectedMetadata>;
  /** project thresholds, which the loaded event may override */
  _phaseThresholds: PhaseThresholds;
  /** when playback started, rundown.actualStart is its time of day */
  _startEpoch: Maybe<Instant>;
  /** rundown day playback started on */
  _startDayOffset: Maybe<Day>;
  /** the absolute offset when the offset was last reset, null measures from the plan */
  _offsetBaseline: Maybe<Duration>;
  /** when the loaded group started, rundown.actualGroupStart is its time of day */
  _groupStartedAt: Maybe<Instant>;
};

const initialNow = timeCore.now();

const runtimeState: RuntimeState = {
  clock: timeCore.toTimeOfDay(initialNow),
  _now: initialNow,
  groupNow: null,
  eventNow: null,
  eventNext: null,
  eventFlag: null,
  offset: { ...runtimeStorePlaceholder.offset },
  timer: { ...runtimeStorePlaceholder.timer },
  rundown: { ...runtimeStorePlaceholder.rundown },
  _timer: {
    forceFinish: null,
    startedAt: null,
    pausedAt: null,
    pausedDuration: 0 as Duration,
    secondaryTarget: null,
    hasFinished: false,
  },
  _rundown: {
    totalDelay: 0,
  },
  _group: null,
  _flag: null,
  _end: null,
  _phaseThresholds: defaultPhaseThresholds,
  _startEpoch: null,
  _startDayOffset: null,
  _offsetBaseline: null,
  _groupStartedAt: null,
};

export function getState(): Readonly<RuntimeState> {
  // create a shallow copy of the state
  return {
    ...runtimeState,
    eventNow: runtimeState.eventNow ? { ...runtimeState.eventNow } : null,
    eventNext: runtimeState.eventNext ? { ...runtimeState.eventNext } : null,
    eventFlag: runtimeState.eventFlag ? { ...runtimeState.eventFlag } : null,
    groupNow: runtimeState.groupNow ? { ...runtimeState.groupNow } : null,
    offset: { ...runtimeState.offset },
    rundown: { ...runtimeState.rundown },
    timer: { ...runtimeState.timer },
    _timer: { ...runtimeState._timer },
    _rundown: { ...runtimeState._rundown },
  };
}

/* clear data related to the current event, but leave in place data about the global run state
 * used when loading a new event but the playback is not interrupted
 */
export function clearEventData() {
  runtimeState.eventNow = null;
  runtimeState.eventNext = null;

  runtimeState.offset.absolute = 0;
  runtimeState.offset.relative = 0;
  runtimeState.offset.expectedFlagStart = null;
  runtimeState.offset.expectedGroupEnd = null;
  runtimeState.offset.expectedRundownEnd = null;

  runtimeState.rundown.selectedEventIndex = null;

  runtimeState.timer.playback = Playback.Stop;
  setClock(runtimeState, timeCore.now());
  runtimeState.timer = { ...runtimeStorePlaceholder.timer };

  // when clearing, we maintain the total delay from the rundown
  runtimeState._timer.forceFinish = null;
  runtimeState._timer.startedAt = null;
  runtimeState._timer.pausedAt = null;
  runtimeState._timer.pausedDuration = 0 as Duration;
  runtimeState._timer.secondaryTarget = null;
  runtimeState._timer.hasFinished = false;
}

// clear all necessary data when doing a full stop and the event is unloaded
export function clearState() {
  runtimeState.eventNow = null;
  runtimeState.eventNext = null;
  runtimeState.eventFlag = null;
  runtimeState._flag = null;

  runtimeState.groupNow = null;
  runtimeState._group = null;
  setGroupStartedAt(runtimeState, null);

  runtimeState.rundown.selectedEventIndex = null;

  runtimeState.offset.absolute = 0;
  runtimeState.offset.relative = 0;
  runtimeState.offset.expectedRundownEnd = null;
  runtimeState.offset.expectedGroupEnd = null;
  runtimeState.offset.expectedFlagStart = null;

  runtimeState._end = null;

  runtimeState.timer.playback = Playback.Stop;
  setClock(runtimeState, timeCore.now());
  runtimeState.timer = { ...runtimeStorePlaceholder.timer };

  // when clearing, we maintain the total delay from the rundown
  runtimeState._timer.forceFinish = null;
  runtimeState._timer.startedAt = null;
  runtimeState._timer.pausedAt = null;
  runtimeState._timer.pausedDuration = 0 as Duration;
  runtimeState._timer.secondaryTarget = null;
  runtimeState._timer.hasFinished = false;

  clearStartAnchor();
}

/** forgets where playback started, the next start anchors the offsets again */
function clearStartAnchor(state = runtimeState) {
  setStartEpoch(state, null);
  state.rundown.currentDay = null;
  state._startDayOffset = null;
  state._offsetBaseline = null;
}

/**
 * The timer base keeps instants, the store shows their time of day
 * these keep both in step
 */
function setClock(state: RuntimeState, epoch: Instant) {
  state._now = epoch;
  state.clock = timeCore.toTimeOfDay(epoch);
}

function setStartedAt(state: RuntimeState, startedAt: Maybe<Instant>) {
  state._timer.startedAt = startedAt;
  state.timer.startedAt = startedAt === null ? null : timeCore.toTimeOfDay(startedAt);
}

function setStartEpoch(state: RuntimeState, startEpoch: Maybe<Instant>) {
  state._startEpoch = startEpoch;
  state.rundown.actualStart = startEpoch === null ? null : timeCore.toTimeOfDay(startEpoch);
}

function setGroupStartedAt(state: RuntimeState, groupStartedAt: Maybe<Instant>) {
  state._groupStartedAt = groupStartedAt;
  state.rundown.actualGroupStart = groupStartedAt === null ? null : timeCore.toTimeOfDay(groupStartedAt);
}

/**
 * Resumes the timer base saved in a restore point
 * Every other timer value follows from it and the clock
 */
function applyRestore(state: RuntimeState, restore: RuntimeRestore) {
  state.timer.playback = restore.playback;
  state.timer.addedTime = restore.addedTime;
  setStartedAt(state, restore.startedAt);
  state._timer.pausedAt = restore.pausedAt;
  state._timer.pausedDuration = restore.pausedDuration;
  if (state.groupNow !== null) {
    setGroupStartedAt(state, restore.groupStartedAt);
  }

  const { startEpoch, startDayOffset } = restore;
  if (startEpoch !== null && startDayOffset !== null) {
    setStartEpoch(state, startEpoch);
    state._startDayOffset = startDayOffset;
    state._offsetBaseline = restore.offsetBaseline;
    state.rundown.currentDay = (startDayOffset + timeCore.daysSinceStart(startEpoch, state._now)) as Day;
  }

  if (state._timer.startedAt !== null) {
    state.timer.current = getCurrent(currentInput(state));
    state.timer.elapsed = getElapsed(elapsedInput(state));
    state.timer.expectedFinish = getExpectedFinish(expectedFinishInput(state));
  }
  const { absolute, relative } = getRuntimeOffset(runtimeOffsetInput(state));
  state.offset.absolute = absolute;
  state.offset.relative = relative;
  updateExpectedTimes(state);
}

export function setPhaseThresholds(thresholds: PhaseThresholds) {
  runtimeState._phaseThresholds = thresholds;
  resolveTimerPhases(runtimeState);
  runtimeState.timer.phase = getTimerPhase(timerPhaseInput(runtimeState));
}

function resolveTimerPhases(state: RuntimeState) {
  if (state.eventNow === null) {
    state.timer.timeWarning = null;
    state.timer.timeDanger = null;
    return;
  }
  const { timeWarning, timeDanger } = resolvePhaseThresholds(state.eventNow, state._phaseThresholds);
  state.timer.timeWarning = timeWarning;
  state.timer.timeDanger = timeDanger;
}

/**
 * Utility, allows updating data derived from the rundown
 * Expected times depend on the loaded entries, they are recalculated in updateAll()
 */
export function updateRundownData(metadata: RundownMetadata) {
  // we keep this in private state since there is no UI use case for it
  runtimeState._rundown.totalDelay = metadata.totalDelay;

  runtimeState.rundown.numEvents = metadata.timedEventOrder.length;
  runtimeState.rundown.plannedStart = metadata.firstStart;
  runtimeState.rundown.plannedEnd = metadata.firstStart === null ? null : metadata.firstStart + metadata.totalDuration;
}

/**
 * Loads a given event into state
 */
export function load(
  event: PlayableEvent,
  rundown: Rundown,
  metadata: RundownMetadata,
  restore?: RuntimeRestore,
): boolean {
  // each rundown day starts measured from the plan
  if (runtimeState.eventNow !== null && runtimeState.eventNow.dayOffset !== event.dayOffset) {
    runtimeState._offsetBaseline = null;
  }
  clearEventData();

  const { timedEventOrder } = metadata;
  if (timedEventOrder.length === 0) {
    return false;
  }

  // filter rundown
  const eventIndex = timedEventOrder.findIndex((entryId) => entryId === event.id);
  if (eventIndex === -1) {
    return false;
  }

  // load events in memory along with their data
  loadNow(rundown, metadata, eventIndex);
  loadNext(rundown, metadata, eventIndex);
  loadGroupFlagAndEnd(rundown, metadata);
  resolveTimerPhases(runtimeState);

  // update state
  runtimeState.timer.playback = Playback.Armed;
  runtimeState.timer.duration = calculateDuration(event.timeStart, event.timeEnd);
  runtimeState.timer.current = getCurrent(currentInput(runtimeState));
  runtimeState.rundown.numEvents = metadata.timedEventOrder.length;

  if (restore) {
    applyRestore(runtimeState, restore);
  }
  return event.id === runtimeState.eventNow?.id;
}

/**
 * Loads current event and its public counterpart
 */
export function loadNow(
  rundown: Rundown,
  metadata: RundownMetadata,
  eventIndex: MaybeNumber = runtimeState.rundown.selectedEventIndex,
) {
  if (eventIndex === null) {
    // reset the state to indicate there is no selection
    runtimeState.rundown.selectedEventIndex = null;
    runtimeState.eventNow = null;
    return;
  }

  const eventId = metadata.timedEventOrder[eventIndex];
  if (!eventId) {
    runtimeState.eventNow = null;
    return;
  }
  const event = rundown.entries[eventId] as PlayableEvent;
  runtimeState.rundown.selectedEventIndex = eventIndex;
  runtimeState.eventNow = event;
}

/**
 * Loads the next event and its public counterpart
 */
export function loadNext(
  rundown: Rundown,
  metadata: RundownMetadata,
  eventIndex: MaybeNumber = runtimeState.rundown.selectedEventIndex,
) {
  if (eventIndex === null) {
    // reset the state to indicate there is no future event
    runtimeState.eventNext = null;
    return;
  }
  const nowPlayableIndex = getPlayableIndexFromTimedIndex(metadata, eventIndex);

  if (nowPlayableIndex === null || nowPlayableIndex > metadata.playableEventOrder.length - 2) {
    // we cound not find the event now or the event now is the last playable event
    runtimeState.eventNext = null;
    return;
  }
  const nextId = metadata.playableEventOrder[nowPlayableIndex + 1];
  if (!nextId) {
    runtimeState.eventNext = null;
    return;
  }
  runtimeState.eventNext = rundown.entries[nextId] as PlayableEvent;
}

/**
 * Resume from restore point
 */
export function resume(
  restorePoint: RuntimeRestore,
  event: PlayableEvent,
  rundown: Rundown,
  metadata: RundownMetadata,
) {
  load(event, rundown, metadata, restorePoint);
}

/**
 * We only pass an event if we are hot reloading
 * @param {PlayableEvent} event only passed if we are changing the data if a playing timer
 */
export function updateLoaded(event?: PlayableEvent): string | undefined {
  // if there is no event loaded, nothing to do
  if (runtimeState.eventNow === null) {
    return;
  }

  // we only pass an event for hot reloading, ie: the event has changed
  if (event) {
    runtimeState.eventNow = event;

    // update data which is duplicate between eventNow and timer objects
    runtimeState.timer.duration = calculateDuration(runtimeState.eventNow.timeStart, runtimeState.eventNow.timeEnd);
    runtimeState.timer.current = getCurrent(currentInput(runtimeState));
    runtimeState.timer.expectedFinish = getExpectedFinish(expectedFinishInput(runtimeState));

    // handle edge cases with roll
    if (runtimeState.timer.playback === Playback.Roll) {
      const offsetClock = runtimeState.clock - runtimeState.offset.absolute;
      // if waiting to roll, we update the targets and potentially start the timer
      if (runtimeState._timer.secondaryTarget !== null) {
        if (runtimeState.eventNow.timeStart < offsetClock && offsetClock < runtimeState.eventNow.timeEnd) {
          // if the event is now, we queue a start
          runtimeState._timer.secondaryTarget = runtimeState.eventNow.timeStart as TimeOfDay;
          runtimeState.timer.secondaryTimer = runtimeState._timer.secondaryTarget - offsetClock;
        } else {
          runtimeState._timer.secondaryTarget = normaliseRollStart(
            runtimeState.eventNow.timeStart,
            offsetClock,
          ) as TimeOfDay;
        }
      }
    }
    return runtimeState.eventNow.id;
  }

  // reset changes to timer progress
  runtimeState.timer.playback = Playback.Armed;

  runtimeState.timer.duration = calculateDuration(runtimeState.eventNow.timeStart, runtimeState.eventNow.timeEnd);
  runtimeState.timer.current = runtimeState.timer.duration;

  setStartedAt(runtimeState, null);
  runtimeState._timer.hasFinished = false;
  runtimeState.timer.addedTime = 0;
  runtimeState._timer.pausedAt = null;

  // this could be looked after by the timer
  runtimeState.timer.elapsed = null;
  runtimeState.timer.expectedFinish = getExpectedFinish(expectedFinishInput(runtimeState));

  return runtimeState.eventNow.id;
}

/**
 * Used in situations when we want to hot-reload all events without interrupting timer
 */
export function updateAll(rundown: Rundown, metadata: RundownMetadata) {
  // event now might have moved so we find the event now id and recalculate the the index again
  // a missing event is passed as null: the default index would load whichever event took its place
  const foundIndex = metadata.timedEventOrder.findIndex((id) => id === runtimeState.eventNow?.id);
  const eventNowIndex = foundIndex >= 0 ? foundIndex : null;

  loadNow(rundown, metadata, eventNowIndex);
  loadNext(rundown, metadata, eventNowIndex);
  updateLoaded(runtimeState.eventNow ?? undefined);
  loadGroupFlagAndEnd(rundown, metadata);
  resolveTimerPhases(runtimeState);
  if (isPlaybackActive(runtimeState.timer.playback)) updateExpectedTimes();
}

export function start(state: RuntimeState = runtimeState, epoch: Instant = timeCore.now()): boolean {
  if (state.eventNow === null) {
    return false;
  }
  if (state.timer.playback === Playback.Play) {
    return false;
  }

  setClock(state, epoch);
  state.timer.secondaryTimer = null;

  // add paused time if it exists
  if (state._timer.pausedAt !== null) {
    const timeToAdd = timeCore.wallTimeSince(epoch, state._timer.pausedAt);
    state.timer.addedTime += timeToAdd;
    state._timer.pausedDuration = (state._timer.pausedDuration + timeToAdd) as Duration;
    state._timer.pausedAt = null;
  }

  if (state._timer.startedAt === null) {
    setStartedAt(state, epoch);
  }

  state.timer.playback = Playback.Play;
  state.timer.expectedFinish = getExpectedFinish(expectedFinishInput(state));
  state.timer.elapsed = getElapsed(elapsedInput(state));

  if (state._startEpoch === null) {
    state._startDayOffset = (findDayOffset(getDelayedStart(state.eventNow) as TimeOfDay, state.clock) +
      state.eventNow.dayOffset) as Day;
    state.rundown.currentDay = state._startDayOffset;
    setStartEpoch(state, epoch);
  }

  if (state.groupNow !== null && state._groupStartedAt === null) {
    setGroupStartedAt(state, epoch);
  }

  // update timer phase
  runtimeState.timer.phase = getTimerPhase(timerPhaseInput(runtimeState));

  // update offset
  const { absolute, relative } = getRuntimeOffset(runtimeOffsetInput(runtimeState));
  runtimeState.offset.absolute = absolute;
  runtimeState.offset.relative = relative;

  // as long as there is a timer, we need an planned end
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (state.rundown.plannedEnd === null) {
      throw new Error('runtimeState.start: invalid state received');
    }
  }

  updateExpectedTimes();
  return true;
}

export function pause(state: RuntimeState = runtimeState, epoch: Instant = timeCore.now()): boolean {
  if (state.timer.playback !== Playback.Play) {
    return false;
  }

  state.timer.playback = Playback.Pause;
  setClock(state, epoch);
  state._timer.pausedAt = epoch;
  return true;
}

export function stop(state: RuntimeState = runtimeState): boolean {
  if (state.timer.playback === Playback.Stop) {
    return false;
  }
  clearState();
  return true;
}

/**
 * Exposes functionality to add user time to the timer externally
 */
export function addTime(amount: number, epoch: Instant = timeCore.now()) {
  if (runtimeState.timer.current === null) {
    return false;
  }

  // as long as there is a timer, we need an expected finish
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (runtimeState.timer.expectedFinish === null) {
      throw new Error('runtimeState.addTime: invalid state received');
    }
  }

  // handle edge cases
  // !!! we need to handle side effects before updating the state
  const willGoNegative = amount < 0 && Math.abs(amount) > runtimeState.timer.current;

  if (willGoNegative && !runtimeState._timer.hasFinished) {
    // set finished time so side effects are triggered
    runtimeState._timer.forceFinish = epoch;
  } else {
    const willGoPositive = runtimeState.timer.current < 0 && runtimeState.timer.current + amount > 0;
    if (willGoPositive) {
      runtimeState._timer.hasFinished = false;
    }
  }

  // we can update the state after handling the side effects
  runtimeState.timer.addedTime += amount;
  runtimeState.timer.current += amount;
  runtimeState.timer.elapsed = getElapsed(elapsedInput(runtimeState));

  // update runtime delays: over - under
  const { absolute, relative } = getRuntimeOffset(runtimeOffsetInput(runtimeState));
  runtimeState.offset.absolute = absolute;
  runtimeState.offset.relative = relative;
  runtimeState.timer.expectedFinish = getExpectedFinish(expectedFinishInput(runtimeState));
  updateExpectedTimes();

  return true;
}

/**
 * Time until the next playback boundary, see getTimeToBoundary()
 * Reads the state directly since this is checked on every tick
 */
export function getTimeToNextBoundary(): MaybeNumber {
  return getTimeToBoundary({
    playback: runtimeState.timer.playback,
    current: runtimeState.timer.current as Maybe<Duration>,
    secondaryTimer: runtimeState.timer.secondaryTimer as Maybe<Duration>,
    hasFinished: runtimeState._timer.hasFinished,
    triggerAhead: timerConfig.triggerAhead as Duration,
  });
}

export type UpdateResult = {
  hasTimerFinished: boolean;
  /** when the timer reached its end, set when it finished in this update */
  finishedAt: Maybe<Instant>;
  hasSecondaryTimerFinished: boolean;
};

export function update(epoch: Instant = timeCore.now()): UpdateResult {
  // 0. there are some things we always do
  const previousClock = runtimeState.clock;
  setClock(runtimeState, epoch); // we update the clock on every update call
  const now = runtimeState.clock;

  // 1. is playback idle?
  if (!isPlaybackActive(runtimeState.timer.playback)) {
    return updateIfIdle();
  }

  // calculate currentDay from epoch (days elapsed since playback was started)
  if (runtimeState._startEpoch !== null && runtimeState._startDayOffset !== null) {
    const daysSinceStart = timeCore.daysSinceStart(runtimeState._startEpoch, epoch);
    runtimeState.rundown.currentDay = runtimeState._startDayOffset + daysSinceStart;
  }

  // 2. are we waiting to roll?
  if (runtimeState.timer.playback === Playback.Roll && runtimeState.timer.secondaryTimer !== null) {
    const clockHasCrossedMidnight = hasCrossedMidnight(previousClock, now);
    return updateIfWaitingToRoll(clockHasCrossedMidnight);
  }

  // 3. at this point we know that we are playing an event
  // reset data
  runtimeState.timer.secondaryTimer = null;

  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (runtimeState.timer.duration === null) {
      throw new Error('runtimeState.update: invalid state received');
    }
  }

  // update timer state
  runtimeState.timer.current = getCurrent(currentInput(runtimeState));
  runtimeState.timer.expectedFinish = getExpectedFinish(expectedFinishInput(runtimeState));
  runtimeState.timer.phase = getTimerPhase(timerPhaseInput(runtimeState));
  runtimeState.timer.elapsed = getElapsed(elapsedInput(runtimeState));

  // update runtime, needs up-to-date timer state
  const { absolute, relative } = getRuntimeOffset(runtimeOffsetInput(runtimeState));
  runtimeState.offset.absolute = absolute;
  runtimeState.offset.relative = relative;

  const finishedNow =
    Boolean(runtimeState._timer.forceFinish) ||
    (runtimeState.timer.current <= timerConfig.triggerAhead && !runtimeState._timer.hasFinished);

  // the end is detected ahead of time or on a later tick, the remaining time places it exactly
  let finishedAt: Maybe<Instant> = null;
  if (finishedNow) {
    runtimeState._timer.hasFinished = true;
    finishedAt = runtimeState._timer.forceFinish ?? timeCore.addDuration(epoch, runtimeState.timer.current as Duration);
    runtimeState._timer.forceFinish = null;
  }

  updateExpectedTimes();

  return { hasTimerFinished: finishedNow, finishedAt, hasSecondaryTimerFinished: false };

  function updateIfIdle() {
    // if nothing is running, nothing to do
    return { hasTimerFinished: false, finishedAt: null, hasSecondaryTimerFinished: false };
  }

  function updateIfWaitingToRoll(hasCrossedMidnight: boolean) {
    // eslint-disable-next-line no-unused-labels -- dev code path
    DEV: {
      if (runtimeState.eventNow === null || runtimeState._timer.secondaryTarget === null) {
        throw new Error('runtimeState.updateIfWaitingToRoll: invalid state received');
      }
    }

    // account for offset
    const offsetClock = runtimeState.clock + runtimeState.offset.absolute;
    runtimeState.timer.phase = TimerPhase.Pending;

    if (hasCrossedMidnight) {
      // if we crossed midnight, we need to update the target
      // this is the same logic from the roll function
      runtimeState._timer.secondaryTarget = normaliseRollStart(
        runtimeState.eventNow.timeStart,
        offsetClock,
      ) as TimeOfDay;
    }

    runtimeState.timer.secondaryTimer = runtimeState._timer.secondaryTarget! - offsetClock;
    return {
      hasTimerFinished: false,
      finishedAt: null,
      hasSecondaryTimerFinished: runtimeState.timer.secondaryTimer <= 0,
    };
  }
}

export type RollResult = {
  eventId: MaybeString;
  /** whether roll loaded an event, it may be the one which just finished */
  didLoad: boolean;
  didStart: boolean;
};

export function roll(
  rundown: Rundown,
  metadata: RundownMetadata,
  offset?: Offset,
  epoch: Instant = timeCore.now(),
): RollResult {
  // 1. if an event is running, we simply take over the playback
  if (runtimeState.timer.playback === Playback.Play && runtimeState.rundown.selectedEventIndex !== null) {
    runtimeState.timer.playback = Playback.Roll;
    return { eventId: runtimeState.eventNow?.id ?? null, didLoad: false, didStart: false };
  }

  // we will need to do some calculations, update the time first
  setClock(runtimeState, epoch);

  // 2. if there is an event armed, we use it
  if (runtimeState.timer.playback === Playback.Armed || runtimeState.timer.phase === TimerPhase.Pending) {
    // eslint-disable-next-line no-unused-labels -- dev code path
    DEV: {
      if (runtimeState.eventNow === null) {
        throw new Error('runtimeState.roll: invalid state received');
      }
    }

    if (offset) {
      runtimeState.offset = { ...offset };
      followOffsetBaseline(runtimeState);
    }
    runtimeState.timer.playback = Playback.Roll;

    // account for event that finishes the day after
    const normalisedEndTime =
      runtimeState.eventNow.timeEnd < runtimeState.eventNow.timeStart
        ? runtimeState.eventNow.timeEnd + dayInMs
        : runtimeState.eventNow.timeEnd;
    runtimeState.timer.expectedFinish = normalisedEndTime;

    // account for offset
    const offsetClock = runtimeState.clock - runtimeState.offset.absolute;

    // state catch up
    runtimeState.timer.duration = calculateDuration(runtimeState.eventNow.timeStart, normalisedEndTime);
    runtimeState.timer.current = runtimeState.timer.duration;
    runtimeState.timer.elapsed = 0;

    // check if the event is ready to start or if needs to be pending
    const isNow = checkIsNow(runtimeState.eventNow.timeStart, runtimeState.eventNow.timeEnd, offsetClock);
    if (isNow) {
      /**
       * If we are starting an event in roll mode
       * we backtrace all the start times to the supposed start time of the event
       */
      const plannedStart = timeCore.lastInstantAt(runtimeState.eventNow.timeStart as TimeOfDay, epoch);
      setStartedAt(runtimeState, plannedStart);
      // reset the secondary timer to cancel any countdowns
      runtimeState.timer.secondaryTimer = null;

      if (runtimeState.groupNow !== null && runtimeState._groupStartedAt === null) {
        setGroupStartedAt(runtimeState, plannedStart);
      }

      // the event starts on plan, so a reset has nothing left to measure from
      runtimeState._offsetBaseline = null;
      followOffsetBaseline(runtimeState);

      if (runtimeState._startEpoch === null) {
        backdateShowStart(plannedStart);
      }
    } else {
      runtimeState._timer.secondaryTarget = normaliseRollStart(
        runtimeState.eventNow.timeStart,
        offsetClock,
      ) as TimeOfDay;
      runtimeState.timer.secondaryTimer = runtimeState._timer.secondaryTarget - offsetClock;
      runtimeState.timer.phase = TimerPhase.Pending;
    }

    return { eventId: runtimeState.eventNow.id, didLoad: false, didStart: isNow };
  }

  // 3. if there is no event running, we need to find the next event
  if (metadata.playableEventOrder.length === 0) {
    throw new Error('No playable events found');
  }

  const previousEventId = runtimeState.eventNow?.id;
  // we need to persist the current group state across loads
  clearEventData();
  setClock(runtimeState, epoch);

  // account for offset but we only keep it if passed to us
  if (offset) {
    runtimeState.offset = { ...offset };
    followOffsetBaseline(runtimeState);
  }
  const offsetClock = runtimeState.clock - runtimeState.offset.absolute;

  const { index, isPending } = loadRoll(rundown, metadata, offsetClock);

  // load events in memory along with their data
  loadNow(rundown, metadata, index);
  loadNext(rundown, metadata, index);
  loadGroupFlagAndEnd(rundown, metadata);
  resolveTimerPhases(runtimeState);

  // update roll state
  runtimeState.timer.playback = Playback.Roll;
  runtimeState.rundown.numEvents = metadata.timedEventOrder.length;

  // in roll mode spec, there should always be something to load
  // as long as playableEvents is not empty
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (runtimeState.eventNow === null) {
      throw new Error('runtimeState.roll: invalid state received');
    }
  }

  if (isPending) {
    // there is nothing now, but something coming up
    runtimeState.timer.phase = TimerPhase.Pending;
    // we need to normalise start time in case it is the day after
    runtimeState._timer.secondaryTarget = normaliseRollStart(runtimeState.eventNow.timeStart, offsetClock) as TimeOfDay;
    runtimeState.timer.secondaryTimer = runtimeState._timer.secondaryTarget - offsetClock;

    // preload timer properties
    runtimeState.timer.duration = calculateDuration(runtimeState.eventNow.timeStart, runtimeState.eventNow.timeEnd);
    runtimeState.timer.current = runtimeState.timer.duration;

    // reset rundown state - the rundown will start fresh when the event begins
    clearStartAnchor();

    return {
      eventId: runtimeState.eventNow.id,
      didLoad: runtimeState.eventNow.id !== previousEventId,
      didStart: false,
    };
  }

  /**
   * At this point we know that there is something to run and the event is loaded
   * - ensure the event will finish ontime
   * - account for events that finish the day after
   *
   * when we start in roll mode
   * we need to backtrace all times to the supposed start time of the event
   */
  const plannedStart = timeCore.lastInstantAt(runtimeState.eventNow.timeStart as TimeOfDay, epoch);
  const endTime =
    runtimeState.eventNow.timeEnd < runtimeState.eventNow.timeStart
      ? runtimeState.eventNow.timeEnd + dayInMs
      : runtimeState.eventNow.timeEnd;
  setStartedAt(runtimeState, plannedStart);
  runtimeState.timer.expectedFinish = endTime;

  // state catch up
  runtimeState.timer.duration = calculateDuration(runtimeState.eventNow.timeStart, endTime);
  runtimeState.timer.current = getCurrent(currentInput(runtimeState));
  runtimeState.timer.elapsed = 0;

  // update runtime
  if (runtimeState.groupNow !== null && runtimeState._groupStartedAt === null) {
    setGroupStartedAt(runtimeState, plannedStart);
  }
  backdateShowStart(plannedStart);

  return { eventId: runtimeState.eventNow.id, didLoad: runtimeState.eventNow.id !== previousEventId, didStart: true };
}

/**
 * Moves roll on from the event which finished
 * Loads the next event roll can play and rolls into it, keeping the offset the finished event had
 * Without a next event, roll finds its place by the clock
 */
export function rollNext(rundown: Rundown, metadata: RundownMetadata, epoch: Instant = timeCore.now()): RollResult {
  const offset = { ...runtimeState.offset };
  const next = findNextRollEvent(rundown, metadata, runtimeState.eventNow?.id);
  if (next && load(next, rundown, metadata)) {
    return { ...roll(rundown, metadata, offset, epoch), didLoad: true };
  }
  return roll(rundown, metadata, offset, epoch);
}

/**
 * Backdates the show start to the planned start of the event roll started in, to prevent adding unintended offset
 * Uses the planned start rather than the clock, since the actual start is backdated to it
 */
function backdateShowStart(plannedStart: Instant) {
  const event = runtimeState.eventNow!;
  // a new show start is measured from the plan
  runtimeState._offsetBaseline = null;
  followOffsetBaseline(runtimeState);
  setStartEpoch(runtimeState, plannedStart);
  runtimeState._startDayOffset = (findDayOffset(event.timeStart, timeCore.toTimeOfDay(plannedStart)) +
    event.dayOffset) as Day;
  runtimeState.rundown.currentDay = (runtimeState._startDayOffset +
    timeCore.daysSinceStart(plannedStart, runtimeState._now)) as Day;
}

/**
 * calculates and sets values directly in state
 * - offset.expectedRundownEnd
 * - offset.expectedGroupEnd
 * - offset.expectedFlagStart
 */
function updateExpectedTimes(state = runtimeState) {
  const { offset, rundown } = state;

  if (!state.eventNow) {
    offset.expectedRundownEnd = null;
    offset.expectedGroupEnd = null;
    offset.expectedFlagStart = null;
    return;
  }

  const expectedTimes = getExpectedTimes({
    offset: { absolute: offset.absolute as Duration, relative: offset.relative as Duration },
    currentDay: rundown.currentDay! as Day,
    group: state.groupNow ? state._group : null,
    flag: state.eventFlag ? state._flag : null,
    end: state._end,
  });
  offset.expectedGroupEnd = expectedTimes.expectedGroupEnd;
  offset.expectedFlagStart = expectedTimes.expectedFlagStart;
  offset.expectedRundownEnd = expectedTimes.expectedRundownEnd;
}

/**
 * The timer calculations take explicit inputs
 * these read them from the runtime state, typing its numeric fields by their temporal meaning
 */
function currentInput(state: RuntimeState): CurrentInput {
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (state.eventNow === null || state.timer.duration === null) {
      throw new Error('runtimeState.currentInput: invalid state received');
    }
  }
  const { eventNow, timer } = state;
  return {
    clock: state.clock,
    event: {
      countToEnd: eventNow.countToEnd,
      timeStart: eventNow.timeStart as TimeOfDay,
      dayOffset: eventNow.dayOffset,
    },
    currentDay: state.rundown.currentDay as Maybe<Day>,
    sinceStart: sinceStart(state),
    duration: timer.duration as Duration,
    addedTime: timer.addedTime as Duration,
    pausedTime: pausedTime(state),
  };
}

function expectedFinishInput(state: RuntimeState): ExpectedFinishInput {
  const { eventNow, timer } = state;
  return {
    event: eventNow && { countToEnd: eventNow.countToEnd, timeEnd: eventNow.timeEnd as TimeOfDay },
    startedAt: timer.startedAt as Maybe<TimeOfDay>,
    duration: timer.duration as Maybe<Duration>,
    addedTime: timer.addedTime as Duration,
    pausedTime: pausedTime(state),
  };
}

function elapsedInput(state: RuntimeState): ElapsedInput {
  return {
    sinceStart: sinceStart(state),
    pausedDuration: state._timer.pausedDuration,
  };
}

/** wall clock time from the start of the loaded event to the pause, or to now when running */
function sinceStart(state: RuntimeState): Maybe<Duration> {
  const { startedAt, pausedAt } = state._timer;
  if (startedAt === null) return null;
  return timeCore.wallTimeSince(pausedAt ?? state._now, startedAt);
}

/** wall clock time spent in the ongoing pause */
function pausedTime(state: RuntimeState): Duration {
  const { pausedAt } = state._timer;
  return pausedAt === null ? (0 as Duration) : timeCore.wallTimeSince(state._now, pausedAt);
}

function runtimeOffsetInput(state: RuntimeState): RuntimeOffsetInput {
  const { eventNow, timer } = state;
  return {
    event: eventNow && {
      countToEnd: eventNow.countToEnd,
      timeStart: eventNow.timeStart as TimeOfDay,
      dayOffset: eventNow.dayOffset,
      // roll starts events on their planned time, so its offset ignores delays until roll follows them
      delay: (timer.playback === Playback.Roll ? 0 : eventNow.delay) as Duration,
    },
    startedAt: timer.startedAt as Maybe<TimeOfDay>,
    current: timer.current as Maybe<Duration>,
    addedTime: timer.addedTime as Duration,
    pausedTime: pausedTime(state),
    startDayOffset: state._startDayOffset,
    offsetBaseline: state._offsetBaseline,
  };
}

function timerPhaseInput(state: RuntimeState): TimerPhaseInput {
  const { timer } = state;
  const hasThresholds = timer.timeWarning !== null && timer.timeDanger !== null;
  return {
    playback: timer.playback,
    current: timer.current as Maybe<Duration>,
    secondaryTimer: timer.secondaryTimer as Maybe<Duration>,
    event: hasThresholds
      ? { timeDanger: timer.timeDanger as Duration, timeWarning: timer.timeWarning as Duration }
      : null,
  };
}

/**
 * Finds the loaded event's group end, next flag and rundown end
 * The loaded event is located in the timed order by its ID, so a loaded event which is skipped still has downstream events
 */
export function loadGroupFlagAndEnd(
  rundown: Rundown,
  metadata: RundownMetadata,
  state = runtimeState, // used for testing
) {
  const previousGroup = state.groupNow?.id;
  state.groupNow = null;
  state._group = null;
  state.eventFlag = null;
  state._flag = null;
  state._end = null;

  if (state.eventNow === null) {
    setGroupStartedAt(state, null);
    return;
  }

  const loadedId = state.eventNow.id;
  const currentGroupId = state.eventNow.parent;
  const { entries } = rundown;

  const orderInGroup = currentGroupId ? (entries[currentGroupId] as OntimeGroup).entries : null;
  state.groupNow = currentGroupId ? (entries[currentGroupId] as OntimeGroup) : null;
  const lastEventInGroup = orderInGroup ? getLastEventNormal(rundown.entries, orderInGroup).lastEvent : null;

  if (previousGroup !== currentGroupId) {
    setGroupStartedAt(state, null);
  }

  const links = getLinksToLoaded(entries, metadata.timedEventOrder, loadedId);
  const toExpected = (event: OntimeEvent, { totalGap, isLinkedToLoaded }: LinkToLoaded) => ({
    event,
    accumulatedGap: totalGap,
    isLinkedToLoaded,
    isLoaded: event.id === loadedId,
  });

  const groupEndLink = lastEventInGroup ? links.get(lastEventInGroup.id) : undefined;
  if (lastEventInGroup && groupEndLink) {
    state._group = toExpected(lastEventInGroup, groupEndLink);
  }

  // the loaded event is not allowed to be the next flag
  const flagId = metadata.flags.find((id) => id !== loadedId && links.has(id));
  if (flagId) {
    const flag = entries[flagId] as PlayableEvent; // flags only hold playable events
    state.eventFlag = flag;
    state._flag = toExpected(flag, links.get(flagId) as LinkToLoaded);
  }

  const lastID = metadata.playableEventOrder.at(-1);
  if (lastID) {
    // the last event is upstream when a skipped event is loaded after it
    const endLink = links.get(lastID) ?? { totalGap: 0, isLinkedToLoaded: true };
    state._end = toExpected(entries[lastID] as OntimeEvent, endLink);
  }
}

/**
 * Measures the offset from now: what is running stays, the schedule after it moves by the current offset
 * The absolute offset, which roll and the hard outs follow, is unchanged
 */
export function resetOffset(): boolean {
  const { timer, offset } = runtimeState;
  if (!isPlaybackActive(timer.playback) || runtimeState._startEpoch === null || offset.relative === 0) {
    return false;
  }
  // a reset which lands on the plan stores no baseline
  setOffsetBaseline(runtimeState, offset.absolute === 0 ? null : (offset.absolute as Duration));
  return true;
}

/** Measures the offset from the plan again, undoing a reset */
export function clearOffsetReset(): boolean {
  if (runtimeState._offsetBaseline === null) {
    return false;
  }
  setOffsetBaseline(runtimeState, null);
  return true;
}

/** A reset only moves the relative offset, the absolute offset stays as it is */
function setOffsetBaseline(state: RuntimeState, baseline: Maybe<Duration>) {
  state._offsetBaseline = baseline;
  followOffsetBaseline(state);
  updateExpectedTimes(state);
}

/** Keeps the relative offset counting from the baseline when the absolute offset is set directly */
function followOffsetBaseline(state: RuntimeState) {
  state.offset.relative = state.offset.absolute - (state._offsetBaseline ?? 0);
}
