import {
  Day,
  Duration,
  Instant,
  Maybe,
  MaybeNumber,
  MaybeString,
  Offset,
  OffsetMode,
  OntimeEvent,
  OntimeGroup,
  PlayableEvent,
  Playback,
  Rundown,
  RundownState,
  TimeOfDay,
  TimerPhase,
  TimerState,
  isOntimeEvent,
  runtimeStorePlaceholder,
} from 'ontime-types';
import { calculateDuration, checkIsNow, dayInMs, getLastEventNormal, isPlaybackActive } from 'ontime-utils';

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
    pausedAt: Maybe<TimeOfDay>;
    pausedDuration: number;
    secondaryTarget: Maybe<TimeOfDay>;
    hasFinished: boolean;
  };
  _rundown: {
    totalDelay: number; // this value comes from rundown service
  };
  _group: Maybe<ExpectedMetadata>;
  _flag: Maybe<ExpectedMetadata>;
  _end: Maybe<ExpectedMetadata>;
  _startEpoch: Maybe<Instant>;
  _startDayOffset: Maybe<Day>;
};

const runtimeState: RuntimeState = {
  clock: timeCore.timeOfDayNow(),
  groupNow: null,
  eventNow: null,
  eventNext: null,
  eventFlag: null,
  offset: { ...runtimeStorePlaceholder.offset },
  timer: { ...runtimeStorePlaceholder.timer },
  rundown: { ...runtimeStorePlaceholder.rundown },
  _timer: {
    forceFinish: null,
    pausedAt: null,
    pausedDuration: 0,
    secondaryTarget: null,
    hasFinished: false,
  },
  _rundown: {
    totalDelay: 0,
  },
  _group: null,
  _flag: null,
  _end: null,
  _startEpoch: null,
  _startDayOffset: null,
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
  runtimeState.clock = timeCore.timeOfDayNow();
  runtimeState.timer = { ...runtimeStorePlaceholder.timer };

  // when clearing, we maintain the total delay from the rundown
  runtimeState._timer.forceFinish = null;
  runtimeState._timer.pausedAt = null;
  runtimeState._timer.pausedDuration = 0;
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

  runtimeState.rundown.actualStart = null;
  runtimeState.rundown.selectedEventIndex = null;

  runtimeState.offset.absolute = 0;
  runtimeState.offset.relative = 0;
  runtimeState.offset.expectedRundownEnd = null;
  runtimeState.offset.expectedGroupEnd = null;
  runtimeState.offset.expectedFlagStart = null;

  runtimeState._end = null;

  runtimeState.timer.playback = Playback.Stop;
  runtimeState.clock = timeCore.timeOfDayNow();
  runtimeState.timer = { ...runtimeStorePlaceholder.timer };

  // when clearing, we maintain the total delay from the rundown
  runtimeState._timer.forceFinish = null;
  runtimeState._timer.pausedAt = null;
  runtimeState._timer.pausedDuration = 0;
  runtimeState._timer.secondaryTarget = null;
  runtimeState._timer.hasFinished = false;

  runtimeState._startEpoch = null;
  runtimeState._startDayOffset = null;
  runtimeState.rundown.currentDay = null;
}

/**
 * Utility to allow modifying the state from the outside
 * @param newState
 */
function patchTimer(newState: Partial<TimerState & RuntimeRestore>) {
  for (const key in newState) {
    if (key in runtimeState.timer) {
      // @ts-expect-error -- not sure how to type this in a sane way
      runtimeState.timer[key] = newState[key];
    } else if (key in runtimeState._timer) {
      // in case of a RestorePoint we will receive a pausedAt value
      // which is needed to resume a paused timer
      // @ts-expect-error -- not sure how to type this in a sane way
      runtimeState._timer[key] = newState[key];
    }
  }
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
  initialData?: Partial<TimerState & RuntimeRestore>,
): boolean {
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

  // update state
  runtimeState.timer.playback = Playback.Armed;
  runtimeState.timer.duration = calculateDuration(event.timeStart, event.timeEnd);
  runtimeState.timer.current = getCurrent(currentInput(runtimeState));
  runtimeState.rundown.numEvents = metadata.timedEventOrder.length;

  // patch with potential provided data
  if (initialData) {
    patchTimer(initialData);
    const startEpoch = initialData?.startEpoch;
    const firstStart = initialData?.firstStart;
    const currentDay = initialData?.currentDay;
    if (
      (firstStart === null || typeof firstStart === 'number') &&
      (startEpoch === null || typeof startEpoch === 'number')
    ) {
      runtimeState.rundown.actualStart = firstStart;
      runtimeState._startEpoch = startEpoch;
      if (firstStart !== null && runtimeState.rundown.plannedStart !== null) {
        runtimeState._startDayOffset = findDayOffset(runtimeState.rundown.plannedStart, firstStart);
      }
      if (currentDay !== undefined) {
        runtimeState.rundown.currentDay = currentDay;
      }
      const { absolute, relative } = getRuntimeOffset(runtimeOffsetInput(runtimeState));
      runtimeState.offset.absolute = absolute;
      runtimeState.offset.relative = relative;
      updateExpectedTimes();
    }
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

  runtimeState.timer.startedAt = null;
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
  if (isPlaybackActive(runtimeState.timer.playback)) updateExpectedTimes();
}

export function start(state: RuntimeState = runtimeState, epoch: Instant = timeCore.now()): boolean {
  if (state.eventNow === null) {
    return false;
  }
  if (state.timer.playback === Playback.Play) {
    return false;
  }

  const now = timeCore.toTimeOfDay(epoch);

  state.clock = now;
  state.timer.secondaryTimer = null;

  // add paused time if it exists
  if (state._timer.pausedAt !== null) {
    const timeToAdd = timeCore.elapsedTime(state.clock, state._timer.pausedAt);
    state.timer.addedTime += timeToAdd;
    state._timer.pausedDuration += timeToAdd;
    state._timer.pausedAt = null;
  }

  if (state.timer.startedAt === null) {
    state.timer.startedAt = state.clock;
  }

  state.timer.playback = Playback.Play;
  state.timer.expectedFinish = getExpectedFinish(expectedFinishInput(state));
  state.timer.elapsed = getElapsed(elapsedInput(state));

  if (state.rundown.actualStart === null) {
    state._startDayOffset = (findDayOffset(state.eventNow.timeStart, state.clock) + state.eventNow.dayOffset) as Day;
    state.rundown.currentDay = state._startDayOffset;
    state._startEpoch = epoch;
    state.rundown.actualStart = state.clock;
  }

  if (state.groupNow !== null && state.rundown.actualGroupStart === null) {
    state.rundown.actualGroupStart = state.clock;
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
  state.clock = timeCore.toTimeOfDay(epoch);
  state._timer.pausedAt = state.clock;
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
  const now = timeCore.toTimeOfDay(epoch);
  runtimeState.clock = now; // we update the clock on every update call

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
  const now = timeCore.toTimeOfDay(epoch);
  runtimeState.clock = now;

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
      const plannedStart = runtimeState.eventNow.timeStart;
      runtimeState.timer.startedAt = plannedStart;
      // reset the secondary timer to cancel any countdowns
      runtimeState.timer.secondaryTimer = null;

      if (runtimeState.groupNow !== null && runtimeState.rundown.actualGroupStart === null) {
        runtimeState.rundown.actualGroupStart = plannedStart;
      }

      if (runtimeState.rundown.actualStart === null) {
        backdateShowStart(plannedStart, epoch);
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
  runtimeState.clock = now;

  // account for offset but we only keep it if passed to us
  if (offset) {
    runtimeState.offset = { ...offset };
  }
  const offsetClock = runtimeState.clock - runtimeState.offset.absolute;

  const { index, isPending } = loadRoll(rundown, metadata, offsetClock);

  // load events in memory along with their data
  loadNow(rundown, metadata, index);
  loadNext(rundown, metadata, index);
  loadGroupFlagAndEnd(rundown, metadata);

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
    runtimeState.rundown.actualStart = null;
    runtimeState.rundown.currentDay = null;
    runtimeState._startDayOffset = null;
    runtimeState._startEpoch = null;

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
  const plannedStart = runtimeState.eventNow.timeStart;
  const endTime =
    runtimeState.eventNow.timeEnd < runtimeState.eventNow.timeStart
      ? runtimeState.eventNow.timeEnd + dayInMs
      : runtimeState.eventNow.timeEnd;
  runtimeState.timer.startedAt = plannedStart;
  runtimeState.timer.expectedFinish = endTime;

  // state catch up
  runtimeState.timer.duration = calculateDuration(runtimeState.eventNow.timeStart, endTime);
  runtimeState.timer.current = getCurrent(currentInput(runtimeState));
  runtimeState.timer.elapsed = 0;

  // update runtime
  if (runtimeState.groupNow !== null && runtimeState.rundown.actualGroupStart === null) {
    runtimeState.rundown.actualGroupStart = plannedStart;
  }
  backdateShowStart(plannedStart, epoch);

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
function backdateShowStart(plannedStart: number, epoch: Instant) {
  const event = runtimeState.eventNow!;
  runtimeState.rundown.actualStart = plannedStart;
  runtimeState._startDayOffset = (findDayOffset(event.timeStart, plannedStart) + event.dayOffset) as Day;
  // the instant the event conceptually started
  const timeElapsed = timeCore.elapsedTime(runtimeState.clock, plannedStart as TimeOfDay);
  runtimeState._startEpoch = timeCore.addDuration(epoch, -timeElapsed as Duration);
  runtimeState.rundown.currentDay = (runtimeState._startDayOffset +
    timeCore.daysSinceStart(runtimeState._startEpoch, epoch)) as Day;
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
    mode: offset.mode,
    offset: { absolute: offset.absolute as Duration, relative: offset.relative as Duration },
    plannedStart: rundown.plannedStart as Maybe<TimeOfDay>,
    actualStart: rundown.actualStart as Maybe<TimeOfDay>,
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
      timeEnd: eventNow.timeEnd as TimeOfDay,
    },
    startedAt: timer.startedAt as Maybe<TimeOfDay>,
    duration: timer.duration as Duration,
    addedTime: timer.addedTime as Duration,
    pausedAt: state._timer.pausedAt,
  };
}

function expectedFinishInput(state: RuntimeState): ExpectedFinishInput {
  const { eventNow, timer } = state;
  return {
    clock: state.clock,
    event: eventNow && { countToEnd: eventNow.countToEnd, timeEnd: eventNow.timeEnd as TimeOfDay },
    startedAt: timer.startedAt as Maybe<TimeOfDay>,
    duration: timer.duration as Maybe<Duration>,
    addedTime: timer.addedTime as Duration,
    pausedAt: state._timer.pausedAt,
  };
}

function elapsedInput(state: RuntimeState): ElapsedInput {
  return {
    clock: state.clock,
    startedAt: state.timer.startedAt as Maybe<TimeOfDay>,
    pausedAt: state._timer.pausedAt,
    pausedDuration: state._timer.pausedDuration as Duration,
  };
}

function runtimeOffsetInput(state: RuntimeState): RuntimeOffsetInput {
  const { eventNow, timer, rundown } = state;
  return {
    clock: state.clock,
    event: eventNow && {
      countToEnd: eventNow.countToEnd,
      timeStart: eventNow.timeStart as TimeOfDay,
      dayOffset: eventNow.dayOffset,
    },
    startedAt: timer.startedAt as Maybe<TimeOfDay>,
    current: timer.current as Maybe<Duration>,
    addedTime: timer.addedTime as Duration,
    pausedAt: state._timer.pausedAt,
    startDayOffset: state._startDayOffset,
    plannedStart: rundown.plannedStart as Maybe<TimeOfDay>,
    actualStart: rundown.actualStart as Maybe<TimeOfDay>,
  };
}

function timerPhaseInput(state: RuntimeState): TimerPhaseInput {
  const { eventNow, timer } = state;
  return {
    playback: timer.playback,
    current: timer.current as Maybe<Duration>,
    secondaryTimer: timer.secondaryTimer as Maybe<Duration>,
    event: eventNow && {
      timeDanger: eventNow.timeDanger as Duration,
      timeWarning: eventNow.timeWarning as Duration,
    },
  };
}

/**
 * Finds the loaded event's group end, next flag and rundown end
 * The loaded event is located in the playable order by its ID,
 * callers hold indexes in the timed order, which also contains skipped events
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
    state.rundown.actualGroupStart = null;
    return;
  }

  const currentGroupId = state.eventNow.parent;
  const flagsPresent = metadata.flags.length !== 0;

  const { playableEventOrder } = metadata;
  const { entries } = rundown;

  const orderInGroup = currentGroupId ? (entries[currentGroupId] as OntimeGroup).entries : null;
  state.groupNow = currentGroupId ? (entries[currentGroupId] as OntimeGroup) : null;
  const lastEventInGroup = orderInGroup ? getLastEventNormal(rundown.entries, orderInGroup).lastEvent : null;

  if (previousGroup !== currentGroupId) {
    state.rundown.actualGroupStart = null;
  }

  // if we don't have a any flags in the rundown then no need to look for it
  let foundFlag = !flagsPresent;
  // if we don't have a last event for the group there is no need to find its end time
  let foundGroupEnd = lastEventInGroup === null;

  let accumulatedGap = 0;
  let isLinkedToLoaded = true;
  let previousWasCountToEnd: Maybe<number> = null;

  // a loaded event which is no longer playable (ie: skipped while loaded) has no downstream events to search
  const currentIndex = playableEventOrder.indexOf(state.eventNow.id);
  const searchFrom = currentIndex === -1 ? playableEventOrder.length : currentIndex;

  for (let idx = searchFrom; idx < playableEventOrder.length; idx++) {
    const entry = entries[playableEventOrder[idx]];

    if (isOntimeEvent(entry)) {
      if (idx !== currentIndex) {
        // we only accumulate data after the loaded event

        if (previousWasCountToEnd !== null) {
          /** previous event was countToEnd: add its duration as a positive gap (it "gives back" time downstream)
           *   and break the link to the loaded event since countToEnd events reset the schedule
           */
          accumulatedGap += entry.gap + previousWasCountToEnd;
          isLinkedToLoaded = false;
        } else {
          accumulatedGap += entry.gap;
          isLinkedToLoaded = isLinkedToLoaded && entry.linkStart;
        }

        if (entry.countToEnd) {
          previousWasCountToEnd = entry.duration;
        } else {
          previousWasCountToEnd = null;
        }

        // and the loaded event is not allowed to be the next flag
        if (!foundFlag && metadata.flags.includes(entry.id)) {
          foundFlag = true;
          state.eventFlag = entry as PlayableEvent; // we know it is playable as it is coming from the playableEventOrder list
          state._flag = { event: entry, isLinkedToLoaded, accumulatedGap };
        }
      }

      if (!foundGroupEnd && entry.id === lastEventInGroup?.id) {
        foundGroupEnd = true;
        state._group = { event: lastEventInGroup, isLinkedToLoaded, accumulatedGap };
      }
    }
  }

  const lastID = playableEventOrder.at(-1);
  const lastEvent = lastID ? (entries[lastID] as OntimeEvent) : null;
  if (lastEvent) {
    state._end = { event: lastEvent, isLinkedToLoaded, accumulatedGap };
  }
}

export function setOffsetMode(mode: OffsetMode) {
  runtimeState.offset.mode = mode;
  if (isPlaybackActive(runtimeState.timer.playback)) updateExpectedTimes();
}
