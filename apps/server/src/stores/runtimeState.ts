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
import {
  calculateDuration,
  checkIsNow,
  dayInMs,
  getExpectedStart,
  getLastEventNormal,
  isPlaybackActive,
} from 'ontime-utils';

import { RundownMetadata } from '../api-data/rundown/rundown.types.js';
import { getPlayableIndexFromTimedIndex } from '../api-data/rundown/rundown.utils.js';
import * as timeCore from '../lib/time-core/timeCore.js';
import type { RestorePoint } from '../services/restore-service/restore.type.js';
import { loadRoll, normaliseRollStart } from '../services/rollUtils.js';
import {
  findDayOffset,
  getCurrent,
  getExpectedFinish,
  getRuntimeOffset,
  getTimerPhase,
  hasCrossedMidnight,
} from '../services/timerUtils.js';
import { timerConfig } from '../setup/config.js';

type ExpectedMetadata = {
  event: OntimeEvent;
  accumulatedGap: number;
  isLinkedToLoaded: boolean;
} | null;

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
    forceFinish: Maybe<TimeOfDay>; // whether we should declare an event as finished, will contain the finish time
    pausedAt: Maybe<TimeOfDay>;
    secondaryTarget: Maybe<TimeOfDay>;
    hasFinished: boolean;
  };
  _rundown: {
    totalDelay: number; // this value comes from rundown service
  };
  _group: ExpectedMetadata;
  _flag: ExpectedMetadata;
  _end: ExpectedMetadata;
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

/**
 * The exported functions below operate on the module singleton.
 * They delegate to the *Core functions which contain the logic and
 * operate exclusively on the state they receive, so the logic can be
 * exercised in isolation
 */

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

export function clearEventData() {
  clearEventDataCore(runtimeState);
}

/* clear data related to the current event, but leave in place data about the global run state
 * used when loading a new event but the playback is not interrupted
 */
export function clearEventDataCore(state: RuntimeState) {
  state.eventNow = null;
  state.eventNext = null;

  state.offset.absolute = 0;
  state.offset.relative = 0;
  state.offset.expectedFlagStart = null;
  state.offset.expectedGroupEnd = null;
  state.offset.expectedRundownEnd = null;

  state.rundown.selectedEventIndex = null;

  state.timer.playback = Playback.Stop;
  state.clock = timeCore.timeOfDayNow();
  state.timer = { ...runtimeStorePlaceholder.timer };

  // when clearing, we maintain the total delay from the rundown
  state._timer.forceFinish = null;
  state._timer.pausedAt = null;
  state._timer.secondaryTarget = null;
  state._timer.hasFinished = false;
}

export function clearState() {
  clearStateCore(runtimeState);
}

// clear all necessary data when doing a full stop and the event is unloaded
export function clearStateCore(state: RuntimeState) {
  state.eventNow = null;
  state.eventNext = null;
  state.eventFlag = null;
  state._flag = null;

  state.groupNow = null;
  state._group = null;

  state.rundown.actualStart = null;
  state.rundown.selectedEventIndex = null;

  state.offset.absolute = 0;
  state.offset.relative = 0;
  state.offset.expectedRundownEnd = null;
  state.offset.expectedGroupEnd = null;
  state.offset.expectedFlagStart = null;

  state._end = null;

  state.timer.playback = Playback.Stop;
  state.clock = timeCore.timeOfDayNow();
  state.timer = { ...runtimeStorePlaceholder.timer };

  // when clearing, we maintain the total delay from the rundown
  state._timer.forceFinish = null;
  state._timer.pausedAt = null;
  state._timer.secondaryTarget = null;
  state._timer.hasFinished = false;

  state._startEpoch = null;
  state._startDayOffset = null;
  state.rundown.currentDay = null;
}

/**
 * Utility to allow modifying the state from the outside
 * @param newState
 */
function patchTimerCore(state: RuntimeState, newState: Partial<TimerState & RestorePoint>) {
  for (const key in newState) {
    if (key in state.timer) {
      // @ts-expect-error -- not sure how to type this in a sane way
      state.timer[key] = newState[key];
    } else if (key in state._timer) {
      // in case of a RestorePoint we will receive a pausedAt value
      // which is needed to resume a paused timer
      // @ts-expect-error -- not sure how to type this in a sane way
      state._timer[key] = newState[key];
    }
  }
}

type RundownData = {
  numEvents: number; // length of rundown filtered for timed events
  firstStart: MaybeNumber;
  lastEnd: MaybeNumber;
  totalDelay: number;
  totalDuration: number;
};

export function updateRundownData(rundownData: RundownData) {
  updateRundownDataCore(runtimeState, rundownData);
}

/**
 * Utility, allows updating data derived from the rundown
 * @param playableRundown
 */
export function updateRundownDataCore(state: RuntimeState, rundownData: RundownData) {
  // we keep this in private state since there is no UI use case for it
  state._rundown.totalDelay = rundownData.totalDelay;

  state.rundown.numEvents = rundownData.numEvents;
  state.rundown.plannedStart = rundownData.firstStart;
  state.rundown.plannedEnd =
    rundownData.firstStart === null ? null : rundownData.firstStart + rundownData.totalDuration;

  if (isPlaybackActive(state.timer.playback)) getExpectedTimesCore(state);
}

export function load(
  event: PlayableEvent,
  rundown: Rundown,
  metadata: RundownMetadata,
  initialData?: Partial<TimerState & RestorePoint>,
): boolean {
  return loadCore(runtimeState, event, rundown, metadata, initialData);
}

/**
 * Loads a given event into state
 */
export function loadCore(
  state: RuntimeState,
  event: PlayableEvent,
  rundown: Rundown,
  metadata: RundownMetadata,
  initialData?: Partial<TimerState & RestorePoint>,
): boolean {
  clearEventDataCore(state);

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
  loadNowCore(state, rundown, metadata, eventIndex);
  loadNextCore(state, rundown, metadata, eventIndex);
  loadGroupFlagAndEndCore(state, rundown, metadata, eventIndex);

  // update state
  state.timer.playback = Playback.Armed;
  state.timer.duration = calculateDuration(event.timeStart, event.timeEnd);
  state.timer.current = getCurrent(state);
  state.rundown.numEvents = metadata.timedEventOrder.length;

  // patch with potential provided data
  if (initialData) {
    patchTimerCore(state, initialData);
    const startEpoch = initialData?.startEpoch;
    const firstStart = initialData?.firstStart;
    const currentDay = initialData?.currentDay;
    if (
      (firstStart === null || typeof firstStart === 'number') &&
      (startEpoch === null || typeof startEpoch === 'number')
    ) {
      state.rundown.actualStart = firstStart;
      state._startEpoch = startEpoch;
      if (firstStart !== null && state.rundown.plannedStart !== null) {
        state._startDayOffset = findDayOffset(state.rundown.plannedStart, firstStart);
      }
      if (currentDay !== undefined) {
        state.rundown.currentDay = currentDay;
      }
      const { absolute, relative } = getRuntimeOffset(state);
      state.offset.absolute = absolute;
      state.offset.relative = relative;
      getExpectedTimesCore(state);
    }
  }
  return event.id === state.eventNow?.id;
}

export function loadNow(rundown: Rundown, metadata: RundownMetadata, eventIndex?: MaybeNumber) {
  loadNowCore(runtimeState, rundown, metadata, eventIndex);
}

/**
 * Loads current event and its public counterpart
 * @param eventIndex the index to load, defaults to the currently selected index
 */
export function loadNowCore(
  state: RuntimeState,
  rundown: Rundown,
  metadata: RundownMetadata,
  eventIndex?: MaybeNumber,
) {
  const index = eventIndex === undefined ? state.rundown.selectedEventIndex : eventIndex;
  if (index === null) {
    // reset the state to indicate there is no selection
    state.rundown.selectedEventIndex = null;
    state.eventNow = null;
    return;
  }

  const eventId = metadata.timedEventOrder[index];
  if (!eventId) {
    state.eventNow = null;
    return;
  }
  const event = rundown.entries[eventId] as PlayableEvent;
  state.rundown.selectedEventIndex = index;
  state.eventNow = event;
}

export function loadNext(rundown: Rundown, metadata: RundownMetadata, eventIndex?: MaybeNumber) {
  loadNextCore(runtimeState, rundown, metadata, eventIndex);
}

/**
 * Loads the next event and its public counterpart
 * @param eventIndex the index to load from, defaults to the currently selected index
 */
export function loadNextCore(
  state: RuntimeState,
  rundown: Rundown,
  metadata: RundownMetadata,
  eventIndex?: MaybeNumber,
) {
  const index = eventIndex === undefined ? state.rundown.selectedEventIndex : eventIndex;
  if (index === null) {
    // reset the state to indicate there is no future event
    state.eventNext = null;
    return;
  }
  const nowPlayableIndex = getPlayableIndexFromTimedIndex(metadata, index);

  if (nowPlayableIndex === null || nowPlayableIndex > metadata.playableEventOrder.length - 2) {
    // we cound not find the event now or the event now is the last playable event
    state.eventNext = null;
    return;
  }
  const nextId = metadata.playableEventOrder[nowPlayableIndex + 1];
  if (!nextId) {
    state.eventNext = null;
    return;
  }
  state.eventNext = rundown.entries[nextId] as PlayableEvent;
}

export function resume(restorePoint: RestorePoint, event: PlayableEvent, rundown: Rundown, metadata: RundownMetadata) {
  resumeCore(runtimeState, restorePoint, event, rundown, metadata);
}

/**
 * Resume from restore point
 */
export function resumeCore(
  state: RuntimeState,
  restorePoint: RestorePoint,
  event: PlayableEvent,
  rundown: Rundown,
  metadata: RundownMetadata,
) {
  loadCore(state, event, rundown, metadata, restorePoint);
}

export function updateLoaded(event?: PlayableEvent): string | undefined {
  return updateLoadedCore(runtimeState, event);
}

/**
 * We only pass an event if we are hot reloading
 * @param {PlayableEvent} event only passed if we are changing the data if a playing timer
 */
export function updateLoadedCore(state: RuntimeState, event?: PlayableEvent): string | undefined {
  // if there is no event loaded, nothing to do
  if (state.eventNow === null) {
    return;
  }

  // we only pass an event for hot reloading, ie: the event has changed
  if (event) {
    state.eventNow = event;

    // update data which is duplicate between eventNow and timer objects
    state.timer.duration = calculateDuration(state.eventNow.timeStart, state.eventNow.timeEnd);
    state.timer.current = getCurrent(state);
    state.timer.expectedFinish = getExpectedFinish(state);

    // handle edge cases with roll
    if (state.timer.playback === Playback.Roll) {
      const offsetClock = state.clock - state.offset.absolute;
      // if waiting to roll, we update the targets and potentially start the timer
      if (state._timer.secondaryTarget !== null) {
        if (state.eventNow.timeStart < offsetClock && offsetClock < state.eventNow.timeEnd) {
          // if the event is now, we queue a start
          state._timer.secondaryTarget = state.eventNow.timeStart as TimeOfDay;
          state.timer.secondaryTimer = state._timer.secondaryTarget - offsetClock;
        } else {
          state._timer.secondaryTarget = normaliseRollStart(state.eventNow.timeStart, offsetClock) as TimeOfDay;
        }
      }
    }
    return state.eventNow.id;
  }

  // reset changes to timer progress
  state.timer.playback = Playback.Armed;

  state.timer.duration = calculateDuration(state.eventNow.timeStart, state.eventNow.timeEnd);
  state.timer.current = state.timer.duration;

  state.timer.startedAt = null;
  state._timer.hasFinished = false;
  state.timer.addedTime = 0;
  state._timer.pausedAt = null;

  // this could be looked after by the timer
  state.timer.elapsed = null;
  state.timer.expectedFinish = getExpectedFinish(state);

  return state.eventNow.id;
}

export function updateAll(rundown: Rundown, metadata: RundownMetadata) {
  updateAllCore(runtimeState, rundown, metadata);
}

/**
 * Used in situations when we want to hot-reload all events without interrupting timer
 */
export function updateAllCore(state: RuntimeState, rundown: Rundown, metadata: RundownMetadata) {
  // event now might have moved so we find the event now id and recalculate the the index again
  const eventNowIndex = metadata.timedEventOrder.findIndex((id) => id === state.eventNow?.id);

  loadNowCore(state, rundown, metadata, eventNowIndex >= 0 ? eventNowIndex : undefined);
  loadNextCore(state, rundown, metadata, eventNowIndex >= 0 ? eventNowIndex : undefined);
  updateLoadedCore(state, state.eventNow ?? undefined);
  loadGroupFlagAndEndCore(state, rundown, metadata, eventNowIndex);
}

export function start(): boolean {
  return startCore(runtimeState);
}

export function startCore(state: RuntimeState): boolean {
  if (state.eventNow === null) {
    return false;
  }
  if (state.timer.playback === Playback.Play) {
    return false;
  }

  const epoch = timeCore.now();
  const now = timeCore.toTimeOfDay(epoch);

  state.clock = now;
  state.timer.secondaryTimer = null;

  // add paused time if it exists
  if (state._timer.pausedAt) {
    const timeToAdd = state.clock - state._timer.pausedAt;
    state.timer.addedTime += timeToAdd;
    state._timer.pausedAt = null;
  }

  if (state.timer.startedAt === null) {
    state.timer.startedAt = state.clock;
  }

  state.timer.playback = Playback.Play;
  state.timer.expectedFinish = getExpectedFinish(state);
  state.timer.elapsed = 0;

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
  state.timer.phase = getTimerPhase(state);

  // update offset
  const { absolute, relative } = getRuntimeOffset(state);
  state.offset.absolute = absolute;
  state.offset.relative = relative;

  // as long as there is a timer, we need an planned end
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (state.rundown.plannedEnd === null) {
      throw new Error('runtimeState.start: invalid state received');
    }
  }

  getExpectedTimesCore(state);
  return true;
}

export function pause(): boolean {
  return pauseCore(runtimeState);
}

export function pauseCore(state: RuntimeState): boolean {
  if (state.timer.playback !== Playback.Play) {
    return false;
  }

  state.timer.playback = Playback.Pause;
  state.clock = timeCore.timeOfDayNow();
  state._timer.pausedAt = state.clock;
  return true;
}

export function stop(): boolean {
  return stopCore(runtimeState);
}

export function stopCore(state: RuntimeState): boolean {
  if (state.timer.playback === Playback.Stop) {
    return false;
  }
  clearStateCore(state);
  return true;
}

export function addTime(amount: number): boolean {
  return addTimeCore(runtimeState, amount);
}

/**
 * Exposes functionality to add user time to the timer externally
 */
export function addTimeCore(state: RuntimeState, amount: number): boolean {
  if (state.timer.current === null) {
    return false;
  }

  // as long as there is a timer, we need an expected finish
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (state.timer.expectedFinish === null) {
      throw new Error('runtimeState.addTime: invalid state received');
    }
  }

  // handle edge cases
  // !!! we need to handle side effects before updating the state
  const willGoNegative = amount < 0 && Math.abs(amount) > state.timer.current;

  if (willGoNegative && !state._timer.hasFinished) {
    // set finished time so side effects are triggered
    state._timer.forceFinish = timeCore.timeOfDayNow();
  } else {
    const willGoPositive = state.timer.current < 0 && state.timer.current + amount > 0;
    if (willGoPositive) {
      state._timer.hasFinished = false;
    }
  }

  // we can update the state after handling the side effects
  state.timer.addedTime += amount;
  state.timer.current += amount;

  // update runtime delays: over - under
  const { absolute, relative } = getRuntimeOffset(state);
  state.offset.absolute = absolute;
  state.offset.relative = relative;
  state.timer.expectedFinish = getExpectedFinish(state);
  getExpectedTimesCore(state);

  return true;
}

export type UpdateResult = {
  hasTimerFinished: boolean;
  hasSecondaryTimerFinished: boolean;
};

export function update(): UpdateResult {
  return updateCore(runtimeState);
}

export function updateCore(state: RuntimeState): UpdateResult {
  // 0. there are some things we always do
  const previousClock = state.clock;
  const epoch = timeCore.now();
  const now = timeCore.toTimeOfDay(epoch);
  state.clock = now; // we update the clock on every update call

  // 1. is playback idle?
  if (!isPlaybackActive(state.timer.playback)) {
    return updateIfIdle();
  }

  // calculate currentDay from epoch (days elapsed since playback was started)
  if (state._startEpoch !== null && state._startDayOffset !== null) {
    const daysSinceStart = timeCore.daysSinceStart(state._startEpoch, epoch);
    state.rundown.currentDay = state._startDayOffset + daysSinceStart;
  }

  // 2. are we waiting to roll?
  if (state.timer.playback === Playback.Roll && state.timer.secondaryTimer !== null) {
    const clockHasCrossedMidnight = hasCrossedMidnight(previousClock, now);
    return updateIfWaitingToRoll(clockHasCrossedMidnight);
  }

  // 3. at this point we know that we are playing an event
  // reset data
  state.timer.secondaryTimer = null;

  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (state.timer.duration === null) {
      throw new Error('runtimeState.update: invalid state received');
    }
  }

  // update timer state
  state.timer.current = getCurrent(state);
  state.timer.expectedFinish = getExpectedFinish(state);
  state.timer.phase = getTimerPhase(state);
  state.timer.elapsed = state.timer.duration - state.timer.current;

  // update runtime, needs up-to-date timer state
  const { absolute, relative } = getRuntimeOffset(state);
  state.offset.absolute = absolute;
  state.offset.relative = relative;

  const finishedNow =
    Boolean(state._timer.forceFinish) || (state.timer.current <= timerConfig.triggerAhead && !state._timer.hasFinished);

  if (finishedNow) {
    state._timer.hasFinished = true;
  } else {
    state.timer.expectedFinish = getExpectedFinish(state);
  }

  getExpectedTimesCore(state);

  return { hasTimerFinished: finishedNow, hasSecondaryTimerFinished: false };

  function updateIfIdle() {
    // if nothing is running, nothing to do
    return { hasTimerFinished: false, hasSecondaryTimerFinished: false };
  }

  function updateIfWaitingToRoll(hasCrossedMidnight: boolean) {
    // eslint-disable-next-line no-unused-labels -- dev code path
    DEV: {
      if (state.eventNow === null || state._timer.secondaryTarget === null) {
        throw new Error('runtimeState.updateIfWaitingToRoll: invalid state received');
      }
    }

    // account for offset
    const offsetClock = state.clock + state.offset.absolute;
    state.timer.phase = TimerPhase.Pending;

    if (hasCrossedMidnight) {
      // if we crossed midnight, we need to update the target
      // this is the same logic from the roll function
      state._timer.secondaryTarget = normaliseRollStart(state.eventNow.timeStart, offsetClock) as TimeOfDay;
    }

    state.timer.secondaryTimer = state._timer.secondaryTarget! - offsetClock;
    return {
      hasTimerFinished: false,
      hasSecondaryTimerFinished: state.timer.secondaryTimer <= 0,
    };
  }
}

export function roll(
  rundown: Rundown,
  metadata: RundownMetadata,
  offset?: Offset,
): { eventId: MaybeString; didStart: boolean } {
  return rollCore(runtimeState, rundown, metadata, offset);
}

export function rollCore(
  state: RuntimeState,
  rundown: Rundown,
  metadata: RundownMetadata,
  offset?: Offset,
): { eventId: MaybeString; didStart: boolean } {
  // 1. if an event is running, we simply take over the playback
  if (state.timer.playback === Playback.Play && state.rundown.selectedEventIndex !== null) {
    state.timer.playback = Playback.Roll;
    return { eventId: state.eventNow?.id ?? null, didStart: false };
  }

  // we will need to do some calculations, update the time first
  const epoch = timeCore.now();
  const now = timeCore.toTimeOfDay(epoch);
  state.clock = now;

  // 2. if there is an event armed, we use it
  if (state.timer.playback === Playback.Armed || state.timer.phase === TimerPhase.Pending) {
    // eslint-disable-next-line no-unused-labels -- dev code path
    DEV: {
      if (state.eventNow === null) {
        throw new Error('runtimeState.roll: invalid state received');
      }
    }

    if (offset) {
      state.offset = { ...offset };
    }
    state.timer.playback = Playback.Roll;

    // account for event that finishes the day after
    const normalisedEndTime =
      state.eventNow.timeEnd < state.eventNow.timeStart ? state.eventNow.timeEnd + dayInMs : state.eventNow.timeEnd;
    state.timer.expectedFinish = normalisedEndTime;

    // account for offset
    const offsetClock = state.clock - state.offset.absolute;

    // state catch up
    state.timer.duration = calculateDuration(state.eventNow.timeStart, normalisedEndTime);
    state.timer.current = state.timer.duration;
    state.timer.elapsed = 0;

    // check if the event is ready to start or if needs to be pending
    const isNow = checkIsNow(state.eventNow.timeStart, state.eventNow.timeEnd, offsetClock);
    if (isNow) {
      /**
       * If we are starting an event in roll mode
       * we backtrace all the start times to the supposed start time of the event
       */
      const plannedStart = state.eventNow.timeStart;
      state.timer.startedAt = plannedStart;
      // reset the secondary timer to cancel any countdowns
      state.timer.secondaryTimer = null;

      if (state.groupNow !== null && state.rundown.actualGroupStart === null) {
        state.rundown.actualGroupStart = plannedStart;
      }

      /**
       * we need to backdate the actual start and start metadata
       * to prevent adding unintended offset
       */
      if (state.rundown.actualStart === null) {
        state.rundown.actualStart = plannedStart;
        // use plannedStart (not clock) because actualStart is backdated to plannedStart
        state._startDayOffset = (findDayOffset(state.eventNow.timeStart, plannedStart) +
          state.eventNow.dayOffset) as Day;
        // backdate _startEpoch to when the event conceptually started
        const timeElapsed = timeCore.elapsedTime(state.clock, plannedStart as TimeOfDay);
        state._startEpoch = timeCore.addDuration(epoch, -timeElapsed as Duration);
        // calculate currentDay from the backdated epoch
        state.rundown.currentDay = state._startDayOffset + timeCore.daysSinceStart(state._startEpoch, epoch);
      }
    } else {
      state._timer.secondaryTarget = normaliseRollStart(state.eventNow.timeStart, offsetClock) as TimeOfDay;
      state.timer.secondaryTimer = state._timer.secondaryTarget - offsetClock;
      state.timer.phase = TimerPhase.Pending;
    }

    return { eventId: state.eventNow.id, didStart: isNow };
  }

  // 3. if there is no event running, we need to find the next event
  if (metadata.playableEventOrder.length === 0) {
    throw new Error('No playable events found');
  }

  // we need to persist the current group state across loads
  clearEventDataCore(state);

  // account for offset but we only keep it if passed to us
  if (offset) {
    state.offset = { ...offset };
  }
  const offsetClock = state.clock - state.offset.absolute;

  const { index, isPending } = loadRoll(rundown, metadata, offsetClock);

  // load events in memory along with their data
  loadNowCore(state, rundown, metadata, index);
  loadNextCore(state, rundown, metadata, index);
  loadGroupFlagAndEndCore(state, rundown, metadata, index);

  // update roll state
  state.timer.playback = Playback.Roll;
  state.rundown.numEvents = metadata.timedEventOrder.length;

  // in roll mode spec, there should always be something to load
  // as long as playableEvents is not empty
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (state.eventNow === null) {
      throw new Error('runtimeState.roll: invalid state received');
    }
  }

  if (isPending) {
    // there is nothing now, but something coming up
    state.timer.phase = TimerPhase.Pending;
    // we need to normalise start time in case it is the day after
    state._timer.secondaryTarget = normaliseRollStart(state.eventNow.timeStart, offsetClock) as TimeOfDay;
    state.timer.secondaryTimer = state._timer.secondaryTarget - offsetClock;

    // preload timer properties
    state.timer.duration = calculateDuration(state.eventNow.timeStart, state.eventNow.timeEnd);
    state.timer.current = state.timer.duration;

    // reset rundown state - the rundown will start fresh when the event begins
    state.rundown.actualStart = null;
    state.rundown.currentDay = null;
    state._startDayOffset = null;
    state._startEpoch = null;

    return { eventId: state.eventNow.id, didStart: false };
  }

  /**
   * At this point we know that there is something to run and the event is loaded
   * - ensure the event will finish ontime
   * - account for events that finish the day after
   *
   * when we start in roll mode
   * we need to backtrace all times to the supposed start time of the event
   */
  const plannedStart = state.eventNow.timeStart;
  const endTime =
    state.eventNow.timeEnd < state.eventNow.timeStart ? state.eventNow.timeEnd + dayInMs : state.eventNow.timeEnd;
  state.timer.startedAt = plannedStart;
  state.timer.expectedFinish = endTime;

  // state catch up
  state.timer.duration = calculateDuration(state.eventNow.timeStart, endTime);
  state.timer.current = getCurrent(state);
  state.timer.elapsed = 0;

  // update runtime
  state.rundown.actualStart = plannedStart;
  if (state.groupNow !== null && state.rundown.actualGroupStart === null) {
    state.rundown.actualGroupStart = plannedStart;
  }

  // update metadata
  // use plannedStart (not clock) because actualStart is backdated to plannedStart
  state._startDayOffset = (findDayOffset(state.eventNow.timeStart, plannedStart) + state.eventNow.dayOffset) as Day;
  // backdate _startEpoch to when the event conceptually started
  const timeElapsed = timeCore.elapsedTime(state.clock, plannedStart as TimeOfDay);
  state._startEpoch = timeCore.addDuration(epoch, -timeElapsed as Duration);
  // calculate currentDay from the backdated epoch
  state.rundown.currentDay = (state._startDayOffset + timeCore.daysSinceStart(state._startEpoch, epoch)) as Day;

  return { eventId: state.eventNow.id, didStart: true };
}

/**
 * calculates and sets values directly in state
 * - offset.expectedRundownEnd
 * - offset.expectedGroupEnd
 * - offset.expectedFlagStart
 */
export function getExpectedTimesCore(state: RuntimeState) {
  state.offset.expectedRundownEnd = null;
  state.offset.expectedGroupEnd = null;
  state.offset.expectedFlagStart = null;
  state.offset.expectedRundownEnd = null;

  const { offset } = state;
  const { plannedStart, actualStart } = state.rundown;
  const { eventNow } = state;

  if (!eventNow) return;

  if (state.groupNow) {
    const { _group } = state;
    if (_group !== null) {
      const { event: lastEvent, accumulatedGap, isLinkedToLoaded } = _group;
      const lastEventExpectedStart = getExpectedStart(lastEvent, {
        currentDay: state.rundown.currentDay!,
        totalGap: accumulatedGap,
        isLinkedToLoaded,
        mode: offset.mode,
        offset: offset.mode === OffsetMode.Absolute ? offset.absolute : offset.relative,
        plannedStart,
        actualStart,
      });
      state.offset.expectedGroupEnd = lastEventExpectedStart + lastEvent.duration;
    }
  }

  if (state.eventFlag) {
    const { _flag } = state;
    if (_flag) {
      const { event, accumulatedGap, isLinkedToLoaded } = _flag;
      const expectedStart = getExpectedStart(event, {
        currentDay: state.rundown.currentDay!,
        totalGap: accumulatedGap,
        isLinkedToLoaded,
        mode: offset.mode,
        offset: offset.mode === OffsetMode.Absolute ? offset.absolute : offset.relative,
        plannedStart,
        actualStart,
      });
      state.offset.expectedFlagStart = expectedStart;
    }
  }

  if (state._end) {
    const { event, accumulatedGap, isLinkedToLoaded } = state._end;
    const expectedStart = getExpectedStart(event, {
      currentDay: state.rundown.currentDay!,
      totalGap: accumulatedGap,
      isLinkedToLoaded,
      mode: offset.mode,
      offset: offset.mode === OffsetMode.Absolute ? offset.absolute : offset.relative,
      plannedStart,
      actualStart,
    });
    state.offset.expectedRundownEnd = expectedStart + event.duration;
  }
}

export function loadGroupFlagAndEnd(rundown: Rundown, metadata: RundownMetadata, currentIndex: MaybeNumber) {
  loadGroupFlagAndEndCore(runtimeState, rundown, metadata, currentIndex);
}

export function loadGroupFlagAndEndCore(
  state: RuntimeState,
  rundown: Rundown,
  metadata: RundownMetadata,
  currentIndex: MaybeNumber,
) {
  const previousGroup = state.groupNow?.id;
  state.groupNow = null;
  state._group = null;
  state.eventFlag = null;
  state._flag = null;
  state._end = null;

  if (currentIndex === null || state.eventNow === null) {
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

  for (let idx = currentIndex; idx < playableEventOrder.length; idx++) {
    const entry = entries[playableEventOrder[idx]];

    if (isOntimeEvent(entry)) {
      if (idx !== currentIndex) {
        // we only accumulate data after the loaded event
        accumulatedGap += entry.gap;
        isLinkedToLoaded = isLinkedToLoaded && entry.linkStart;

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
  setOffsetModeCore(runtimeState, mode);
}

export function setOffsetModeCore(state: RuntimeState, mode: OffsetMode) {
  state.offset.mode = mode;
  if (isPlaybackActive(state.timer.playback)) getExpectedTimesCore(state);
}
