import {
  isOntimeEvent,
  MaybeNumber,
  MaybeString,
  OffsetMode,
  OntimeGroup,
  OntimeEvent,
  PlayableEvent,
  Playback,
  Rundown,
  Offset,
  runtimeStorePlaceholder,
  TimerPhase,
  TimerState,
  RundownState,
} from 'ontime-types';
import {
  calculateDuration,
  checkIsNow,
  dayInMs,
  getExpectedStart,
  getLastEventNormal,
  isPlaybackActive,
} from 'ontime-utils';

import { getTimeObject, timeNow } from '../utils/time.js';
import type { RestorePoint } from '../services/restore-service/restore.type.js';
import {
  findDayOffset,
  getCurrent,
  getExpectedFinish,
  getRuntimeOffset,
  getTimerPhase,
} from '../services/timerUtils.js';
import { loadRoll, normaliseRollStart } from '../services/rollUtils.js';
import { timerConfig } from '../setup/config.js';
import { RundownMetadata } from '../api-data/rundown/rundown.types.js';
import { getPlayableIndexFromTimedIndex } from '../api-data/rundown/rundown.utils.js';

type ExpectedMetadata = { event: OntimeEvent; accumulatedGap: number; isLinkedToLoaded: boolean } | null;

export type RuntimeState = {
  clock: number; // realtime clock
  groupNow: OntimeGroup | null;
  eventNow: PlayableEvent | null;
  eventNext: PlayableEvent | null;
  eventFlag: PlayableEvent | null;
  offset: Offset;
  timer: TimerState;
  rundown: RundownState;
  // private properties of the timer calculations
  _timer: {
    forceFinish: MaybeNumber; // whether we should declare an event as finished, will contain the finish time
    pausedAt: MaybeNumber;
    secondaryTarget: MaybeNumber;
    hasFinished: boolean;
  };
  _rundown: {
    totalDelay: number; // this value comes from rundown service
  };
  _group: ExpectedMetadata;
  _flag: ExpectedMetadata;
  _end: ExpectedMetadata;
  _startEpoch: MaybeNumber;
  _startDayOffset: MaybeNumber;
};

const runtimeState: RuntimeState = {
  clock: timeNow(),
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
  runtimeState.clock = timeNow();
  runtimeState.timer = { ...runtimeStorePlaceholder.timer };

  // when clearing, we maintain the total delay from the rundown
  runtimeState._timer.forceFinish = null;
  runtimeState._timer.pausedAt = null;
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
  runtimeState.clock = timeNow();
  runtimeState.timer = { ...runtimeStorePlaceholder.timer };

  // when clearing, we maintain the total delay from the rundown
  runtimeState._timer.forceFinish = null;
  runtimeState._timer.pausedAt = null;
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
function patchTimer(newState: Partial<TimerState & RestorePoint>) {
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
 * @param playableRundown
 */
export function updateRundownData(rundownData: {
  numEvents: number; // length of rundown filtered for timed events
  firstStart: MaybeNumber;
  lastEnd: MaybeNumber;
  totalDelay: number;
  totalDuration: number;
}) {
  // we keep this in private state since there is no UI use case for it
  runtimeState._rundown.totalDelay = rundownData.totalDelay;

  runtimeState.rundown.numEvents = rundownData.numEvents;
  runtimeState.rundown.plannedStart = rundownData.firstStart;
  runtimeState.rundown.plannedEnd =
    rundownData.firstStart === null ? null : rundownData.firstStart + rundownData.totalDuration;

  if (isPlaybackActive(runtimeState.timer.playback)) getExpectedTimes();
}

/**
 * Loads a given event into state
 */
export function load(
  event: PlayableEvent,
  rundown: Rundown,
  metadata: RundownMetadata,
  initialData?: Partial<TimerState & RestorePoint>,
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
  loadGroupFlagAndEnd(rundown, metadata, eventIndex);

  // update state
  runtimeState.timer.playback = Playback.Armed;
  runtimeState.timer.duration = calculateDuration(event.timeStart, event.timeEnd);
  runtimeState.timer.current = getCurrent(runtimeState);
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
      const { absolute, relative } = getRuntimeOffset(runtimeState);
      runtimeState.offset.absolute = absolute;
      runtimeState.offset.relative = relative;
      getExpectedTimes();
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
export function resume(restorePoint: RestorePoint, event: PlayableEvent, rundown: Rundown, metadata: RundownMetadata) {
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
    runtimeState.timer.current = getCurrent(runtimeState);
    runtimeState.timer.expectedFinish = getExpectedFinish(runtimeState);

    // handle edge cases with roll
    if (runtimeState.timer.playback === Playback.Roll) {
      const offsetClock = runtimeState.clock - runtimeState.offset.absolute;
      // if waiting to roll, we update the targets and potentially start the timer
      if (runtimeState._timer.secondaryTarget !== null) {
        if (runtimeState.eventNow.timeStart < offsetClock && offsetClock < runtimeState.eventNow.timeEnd) {
          // if the event is now, we queue a start
          runtimeState._timer.secondaryTarget = runtimeState.eventNow.timeStart;
          runtimeState.timer.secondaryTimer = runtimeState._timer.secondaryTarget - offsetClock;
        } else {
          runtimeState._timer.secondaryTarget = normaliseRollStart(runtimeState.eventNow.timeStart, offsetClock);
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
  runtimeState.timer.expectedFinish = getExpectedFinish(runtimeState);

  return runtimeState.eventNow.id;
}

/**
 * Used in situations when we want to hot-reload all events without interrupting timer
 */
export function updateAll(rundown: Rundown, metadata: RundownMetadata) {
  // event now might have moved so we find the event now id and recalculate the the index again
  const eventNowIndex = metadata.timedEventOrder.findIndex((id) => id === runtimeState.eventNow?.id);

  loadNow(rundown, metadata, eventNowIndex >= 0 ? eventNowIndex : undefined);
  loadNext(rundown, metadata, eventNowIndex >= 0 ? eventNowIndex : undefined);
  updateLoaded(runtimeState.eventNow ?? undefined);
  loadGroupFlagAndEnd(rundown, metadata, eventNowIndex);
}

export function start(state: RuntimeState = runtimeState): boolean {
  if (state.eventNow === null) {
    return false;
  }
  if (state.timer.playback === Playback.Play) {
    return false;
  }

  const [epoch, now] = getTimeObject();
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
    state._startDayOffset = findDayOffset(state.eventNow.timeStart, state.clock) + state.eventNow.dayOffset;
    state.rundown.currentDay = state._startDayOffset;
    state._startEpoch = epoch;
    state.rundown.actualStart = state.clock;
  }

  if (state.groupNow !== null && state.rundown.actualGroupStart === null) {
    state.rundown.actualGroupStart = state.clock;
  }

  // update timer phase
  runtimeState.timer.phase = getTimerPhase(runtimeState);

  // update offset
  const { absolute, relative } = getRuntimeOffset(runtimeState);
  runtimeState.offset.absolute = absolute;
  runtimeState.offset.relative = relative;

  // as long as there is a timer, we need an planned end
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (state.rundown.plannedEnd === null) {
      throw new Error('runtimeState.start: invalid state received');
    }
  }

  getExpectedTimes();
  return true;
}

export function pause(state: RuntimeState = runtimeState): boolean {
  if (state.timer.playback !== Playback.Play) {
    return false;
  }

  state.timer.playback = Playback.Pause;
  state.clock = timeNow();
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
export function addTime(amount: number) {
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
    runtimeState._timer.forceFinish = timeNow();
  } else {
    const willGoPositive = runtimeState.timer.current < 0 && runtimeState.timer.current + amount > 0;
    if (willGoPositive) {
      runtimeState._timer.hasFinished = false;
    }
  }

  // we can update the state after handling the side effects
  runtimeState.timer.addedTime += amount;
  runtimeState.timer.current += amount;

  // update runtime delays: over - under
  const { absolute, relative } = getRuntimeOffset(runtimeState);
  runtimeState.offset.absolute = absolute;
  runtimeState.offset.relative = relative;
  runtimeState.timer.expectedFinish = getExpectedFinish(runtimeState);
  getExpectedTimes();

  return true;
}

export type UpdateResult = {
  hasTimerFinished: boolean;
  hasSecondaryTimerFinished: boolean;
};

export function update(): UpdateResult {
  // 0. there are some things we always do
  const previousClock = runtimeState.clock;
  const [epoch, now] = getTimeObject();
  runtimeState.clock = now; // we update the clock on every update call

  // 1. is playback idle?
  if (!isPlaybackActive(runtimeState.timer.playback)) {
    return updateIfIdle();
  }

  // if we are playing and playback changes. we tick the current runtime day
  if (runtimeState._startDayOffset !== null && runtimeState._startEpoch) {
    runtimeState.rundown.currentDay =
      runtimeState._startDayOffset + Math.floor((epoch - runtimeState._startEpoch) / dayInMs);
  }

  // 2. are we waiting to roll?
  if (runtimeState.timer.playback === Playback.Roll && runtimeState.timer.secondaryTimer !== null) {
    const hasCrossedMidnight = previousClock > runtimeState.clock;
    return updateIfWaitingToRoll(hasCrossedMidnight);
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
  runtimeState.timer.current = getCurrent(runtimeState);
  runtimeState.timer.expectedFinish = getExpectedFinish(runtimeState);
  runtimeState.timer.phase = getTimerPhase(runtimeState);
  runtimeState.timer.elapsed = runtimeState.timer.duration - runtimeState.timer.current;

  // update runtime, needs up-to-date timer state
  const { absolute, relative } = getRuntimeOffset(runtimeState);
  runtimeState.offset.absolute = absolute;
  runtimeState.offset.relative = relative;

  const finishedNow =
    Boolean(runtimeState._timer.forceFinish) ||
    (runtimeState.timer.current <= timerConfig.triggerAhead && !runtimeState._timer.hasFinished);

  if (finishedNow) {
    runtimeState._timer.hasFinished = true;
  } else {
    runtimeState.timer.expectedFinish = getExpectedFinish(runtimeState);
  }

  getExpectedTimes();

  return { hasTimerFinished: finishedNow, hasSecondaryTimerFinished: false };

  function updateIfIdle() {
    // if nothing is running, nothing to do
    return { hasTimerFinished: false, hasSecondaryTimerFinished: false };
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
      runtimeState._timer.secondaryTarget = normaliseRollStart(runtimeState.eventNow.timeStart, offsetClock);
    }

    runtimeState.timer.secondaryTimer = runtimeState._timer.secondaryTarget - offsetClock;
    return { hasTimerFinished: false, hasSecondaryTimerFinished: runtimeState.timer.secondaryTimer <= 0 };
  }
}

export function roll(
  rundown: Rundown,
  metadata: RundownMetadata,
  offset?: Offset,
): { eventId: MaybeString; didStart: boolean } {
  // 1. if an event is running, we simply take over the playback
  if (runtimeState.timer.playback === Playback.Play && runtimeState.rundown.selectedEventIndex !== null) {
    runtimeState.timer.playback = Playback.Roll;
    return { eventId: runtimeState.eventNow?.id ?? null, didStart: false };
  }

  // we will need to do some calculations, update the time first
  const [epoch, now] = getTimeObject();
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
        runtimeState.rundown.actualStart = plannedStart;
        runtimeState._startDayOffset = 0;
        runtimeState._startEpoch = epoch;
      }
    } else {
      runtimeState._timer.secondaryTarget = normaliseRollStart(runtimeState.eventNow.timeStart, offsetClock);
      runtimeState.timer.secondaryTimer = runtimeState._timer.secondaryTarget - offsetClock;
      runtimeState.timer.phase = TimerPhase.Pending;
    }

    return { eventId: runtimeState.eventNow.id, didStart: isNow };
  }

  // 3. if there is no event running, we need to find the next event
  if (metadata.playableEventOrder.length === 0) {
    throw new Error('No playable events found');
  }

  // we need to persist the current group state across loads
  clearEventData();

  // account for offset but we only keep it if passed to us
  if (offset) {
    runtimeState.offset = { ...offset };
  }
  const offsetClock = runtimeState.clock - runtimeState.offset.absolute;

  const { index, isPending } = loadRoll(rundown, metadata, offsetClock);

  // load events in memory along with their data
  loadNow(rundown, metadata, index);
  loadNext(rundown, metadata, index);
  loadGroupFlagAndEnd(rundown, metadata, index);

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
    runtimeState._timer.secondaryTarget = normaliseRollStart(runtimeState.eventNow.timeStart, offsetClock);
    runtimeState.timer.secondaryTimer = runtimeState._timer.secondaryTarget - offsetClock;

    // preload timer properties
    runtimeState.timer.duration = calculateDuration(runtimeState.eventNow.timeStart, runtimeState.eventNow.timeEnd);
    runtimeState.timer.current = runtimeState.timer.duration;
    return { eventId: runtimeState.eventNow.id, didStart: false };
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
  runtimeState.timer.current = getCurrent(runtimeState);
  runtimeState.timer.elapsed = 0;

  // update runtime
  runtimeState.rundown.actualStart = plannedStart;
  if (runtimeState.groupNow !== null && runtimeState.rundown.actualGroupStart === null) {
    runtimeState.rundown.actualGroupStart = plannedStart;
  }

  // update metadata
  runtimeState._startDayOffset = 0;
  runtimeState._startEpoch = epoch;

  return { eventId: runtimeState.eventNow.id, didStart: true };
}

/**
 * calculates and sets values directly in state
 * - offset.expectedRundownEnd
 * - offset.expectedGroupEnd
 * - offset.expectedFlagStart
 */
function getExpectedTimes(state = runtimeState) {
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

export function loadGroupFlagAndEnd(
  rundown: Rundown,
  metadata: RundownMetadata,
  currentIndex: MaybeNumber,
  state = runtimeState, // used for testing
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
  runtimeState.offset.mode = mode;
  if (isPlaybackActive(runtimeState.timer.playback)) getExpectedTimes();
}
