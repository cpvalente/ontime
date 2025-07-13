import {
  CurrentBlockState,
  isOntimeBlock,
  isOntimeEvent,
  MaybeNumber,
  MaybeString,
  OffsetMode,
  PlayableEvent,
  Playback,
  Rundown,
  Runtime,
  runtimeStorePlaceholder,
  TimerPhase,
  TimerState,
  UpcomingEntry,
} from 'ontime-types';
import { calculateDuration, checkIsNow, dayInMs, isPlaybackActive } from 'ontime-utils';

import { timeNow } from '../utils/time.js';
import type { RestorePoint } from '../services/RestoreService.js';
import {
  getCurrent,
  getExpectedBlockFinish,
  getExpectedEnd,
  getExpectedFinish,
  getRuntimeOffset,
  getTimerPhase,
} from '../services/timerUtils.js';
import { loadRoll, normaliseRollStart } from '../services/rollUtils.js';
import { timerConfig } from '../setup/config.js';
import { RundownMetadata } from '../api-data/rundown/rundown.types.js';
import { getPlayableIndexFromTimedIndex } from '../api-data/rundown/rundown.utils.js';
import { getCurrentRundown } from '../api-data/rundown/rundown.dao.js';

export type RuntimeState = {
  clock: number; // realtime clock
  blockNow: CurrentBlockState | null;
  blockNext: MaybeString;
  nextFlag: UpcomingEntry | null;
  eventNow: PlayableEvent | null;
  eventNext: PlayableEvent | null;
  runtime: Runtime;
  timer: TimerState;
  // private properties of the timer calculations
  _timer: {
    forceFinish: MaybeNumber; // whether we should declare an event as finished, will contain the finish time
    pausedAt: MaybeNumber;
    secondaryTarget: MaybeNumber;
  };
  _rundown: {
    totalDelay: number; // this value comes from rundown service
  };
};

const runtimeState: RuntimeState = {
  clock: timeNow(),
  blockNow: null,
  blockNext: null,
  nextFlag: null,
  eventNow: null,
  eventNext: null,
  runtime: { ...runtimeStorePlaceholder.runtime },
  timer: { ...runtimeStorePlaceholder.timer },
  _timer: {
    forceFinish: null,
    pausedAt: null,
    secondaryTarget: null,
  },
  _rundown: {
    totalDelay: 0,
  },
};

export function getState(): Readonly<RuntimeState> {
  // create a shallow copy of the state
  return {
    ...runtimeState,
    eventNow: runtimeState.eventNow ? { ...runtimeState.eventNow } : null,
    eventNext: runtimeState.eventNext ? { ...runtimeState.eventNext } : null,
    runtime: { ...runtimeState.runtime },
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

  runtimeState.runtime.offset = 0;
  runtimeState.runtime.relativeOffset = 0;
  runtimeState.runtime.expectedEnd = null;
  runtimeState.runtime.selectedEventIndex = null;

  if (runtimeState.blockNow) runtimeState.blockNow.expectedEnd = null;

  runtimeState.timer.playback = Playback.Stop;
  runtimeState.clock = timeNow();
  runtimeState.timer = { ...runtimeStorePlaceholder.timer };

  // when clearing, we maintain the total delay from the rundown
  runtimeState._timer.forceFinish = null;
  runtimeState._timer.pausedAt = null;
  runtimeState._timer.secondaryTarget = null;
}

// clear all necessary data when doing a full stop and the event is unloaded
export function clearState() {
  runtimeState.eventNow = null;
  runtimeState.eventNext = null;

  runtimeState.blockNow = null;
  runtimeState.blockNext = null;
  runtimeState.nextFlag = null;

  runtimeState.runtime.offset = 0;
  runtimeState.runtime.relativeOffset = 0;
  runtimeState.runtime.actualStart = null;
  runtimeState.runtime.expectedEnd = null;
  runtimeState.runtime.selectedEventIndex = null;

  runtimeState.timer.playback = Playback.Stop;
  runtimeState.clock = timeNow();
  runtimeState.timer = { ...runtimeStorePlaceholder.timer };

  // when clearing, we maintain the total delay from the rundown
  runtimeState._timer.forceFinish = null;
  runtimeState._timer.pausedAt = null;
  runtimeState._timer.secondaryTarget = null;
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

type RundownData = {
  numEvents: number; // length of rundown filtered for timed events
  firstStart: MaybeNumber;
  lastEnd: MaybeNumber;
  totalDelay: number;
  totalDuration: number;
};

/**
 * Utility, allows updating data derived from the rundown
 * @param playableRundown
 */
export function updateRundownData(rundownData: RundownData) {
  // we keep this in private state since there is no UI use case for it
  runtimeState._rundown.totalDelay = rundownData.totalDelay;

  runtimeState.runtime.numEvents = rundownData.numEvents;
  runtimeState.runtime.plannedStart = rundownData.firstStart;
  runtimeState.runtime.plannedEnd =
    rundownData.firstStart === null ? null : rundownData.firstStart + rundownData.totalDuration;
  runtimeState.runtime.expectedEnd = getExpectedEnd(runtimeState);
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
  loadBlock(rundown);
  loadNextFlag(eventIndex, rundown, metadata);

  // update state
  runtimeState.timer.playback = Playback.Armed;
  runtimeState.timer.duration = calculateDuration(event.timeStart, event.timeEnd);
  runtimeState.timer.current = getCurrent(runtimeState);
  runtimeState.runtime.numEvents = metadata.timedEventOrder.length;

  // patch with potential provided data
  if (initialData) {
    patchTimer(initialData);
    const firstStart = initialData?.firstStart;
    if (firstStart === null || typeof firstStart === 'number') {
      runtimeState.runtime.actualStart = firstStart;
      const { absoluteOffset, relativeOffset } = getRuntimeOffset(runtimeState);
      runtimeState.runtime.offset = absoluteOffset;
      runtimeState.runtime.relativeOffset = relativeOffset;
      runtimeState.runtime.expectedEnd = getExpectedEnd(runtimeState);
    }
    if (typeof initialData.blockStartAt === 'number' && runtimeState.blockNow) {
      runtimeState.blockNow.startedAt = initialData.blockStartAt;
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
  eventIndex: MaybeNumber = runtimeState.runtime.selectedEventIndex,
) {
  if (eventIndex === null) {
    // reset the state to indicate there is no selection
    runtimeState.runtime.selectedEventIndex = null;
    runtimeState.eventNow = null;
    return;
  }

  const event = rundown.entries[metadata.timedEventOrder[eventIndex]] as PlayableEvent;
  runtimeState.runtime.selectedEventIndex = eventIndex;
  runtimeState.eventNow = event;
}

/**
 * Loads the next event and its public counterpart
 */
export function loadNext(
  rundown: Rundown,
  metadata: RundownMetadata,
  eventIndex: MaybeNumber = runtimeState.runtime.selectedEventIndex,
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
      const offsetClock = runtimeState.clock + runtimeState.runtime.offset;
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
  runtimeState.timer.finishedAt = null;
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
  loadBlock(rundown);
}

export function start(state: RuntimeState = runtimeState): boolean {
  if (state.eventNow === null) {
    return false;
  }
  if (state.timer.playback === Playback.Play) {
    return false;
  }

  state.clock = timeNow();
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

  // update block start time
  if (state.blockNow && state.blockNow.startedAt === null) {
    state.blockNow.startedAt = state.clock;
  }

  state.timer.playback = Playback.Play;
  state.timer.expectedFinish = getExpectedFinish(state);
  state.timer.elapsed = 0;

  // update runtime delays: over - under
  if (state.runtime.actualStart === null) {
    state.runtime.actualStart = state.clock;
  }

  // update timer phase
  runtimeState.timer.phase = getTimerPhase(runtimeState);

  // update offset
  const { absoluteOffset, relativeOffset } = getRuntimeOffset(runtimeState);
  runtimeState.runtime.offset = absoluteOffset;
  runtimeState.runtime.relativeOffset = relativeOffset;

  // as long as there is a timer, we need an planned end
  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (state.runtime.plannedEnd === null) {
      throw new Error('runtimeState.start: invalid state received');
    }
  }

  state.runtime.expectedEnd = state.runtime.plannedEnd - state.runtime.offset;
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
  const hasFinished = runtimeState.timer.finishedAt !== null;

  if (willGoNegative && !hasFinished) {
    // set finished time so side effects are triggered
    runtimeState._timer.forceFinish = timeNow();
  } else {
    const willGoPositive = runtimeState.timer.current < 0 && runtimeState.timer.current + amount > 0;
    if (willGoPositive) {
      runtimeState.timer.finishedAt = null;
    }
  }

  // we can update the state after handling the side effects
  runtimeState.timer.addedTime += amount;
  runtimeState.timer.expectedFinish += amount;
  runtimeState.timer.current += amount;

  // update runtime delays: over - under
  const { absoluteOffset, relativeOffset } = getRuntimeOffset(runtimeState);
  runtimeState.runtime.offset = absoluteOffset;
  runtimeState.runtime.relativeOffset = relativeOffset;
  runtimeState.runtime.expectedEnd = getExpectedEnd(runtimeState);

  return true;
}

export type UpdateResult = {
  hasTimerFinished: boolean;
  hasSecondaryTimerFinished: boolean;
};

export function update(): UpdateResult {
  // 0. there are some things we always do
  const previousClock = runtimeState.clock;
  runtimeState.clock = timeNow(); // we update the clock on every update call

  // 1. is playback idle?
  if (!isPlaybackActive(runtimeState.timer.playback)) {
    return updateIfIdle();
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
  const { absoluteOffset, relativeOffset } = getRuntimeOffset(runtimeState);
  runtimeState.runtime.offset = absoluteOffset;
  runtimeState.runtime.relativeOffset = relativeOffset;
  runtimeState.runtime.expectedEnd = getExpectedEnd(runtimeState);

  const finishedNow =
    Boolean(runtimeState._timer.forceFinish) ||
    (runtimeState.timer.current <= timerConfig.triggerAhead && runtimeState.timer.finishedAt === null);

  if (finishedNow) {
    // reset state
    runtimeState.timer.finishedAt = runtimeState._timer.forceFinish ?? runtimeState.clock;
  } else {
    runtimeState.timer.expectedFinish = getExpectedFinish(runtimeState);
  }

  if (runtimeState.blockNow) {
    const expectedBlockFinish = getExpectedBlockFinish(runtimeState, getCurrentRundown());
    runtimeState.blockNow.expectedEnd = expectedBlockFinish;
  }

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
    const offsetClock = runtimeState.clock + runtimeState.runtime.offset;
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
  offset = 0,
): { eventId: MaybeString; didStart: boolean } {
  // 1. if an event is running, we simply take over the playback
  if (runtimeState.timer.playback === Playback.Play && runtimeState.runtime.selectedEventIndex !== null) {
    runtimeState.timer.playback = Playback.Roll;
    return { eventId: runtimeState.eventNow?.id ?? null, didStart: false };
  }

  // 2. if there is an event armed, we use it
  if (runtimeState.timer.playback === Playback.Armed || runtimeState.timer.phase === TimerPhase.Pending) {
    // eslint-disable-next-line no-unused-labels -- dev code path
    DEV: {
      if (runtimeState.eventNow === null) {
        throw new Error('runtimeState.roll: invalid state received');
      }
    }

    runtimeState.runtime.offset = offset;
    runtimeState.timer.playback = Playback.Roll;

    // account for event that finishes the day after
    const normalisedEndTime =
      runtimeState.eventNow.timeEnd < runtimeState.eventNow.timeStart
        ? runtimeState.eventNow.timeEnd + dayInMs
        : runtimeState.eventNow.timeEnd;
    runtimeState.timer.expectedFinish = normalisedEndTime;

    //account for offset
    const offsetClock = runtimeState.clock + runtimeState.runtime.offset;

    // state catch up
    runtimeState.timer.duration = calculateDuration(runtimeState.eventNow.timeStart, normalisedEndTime);
    runtimeState.timer.current = runtimeState.timer.duration;
    runtimeState.timer.elapsed = 0;

    // check if the event is ready to start or if needs to be pending
    const isNow = checkIsNow(runtimeState.eventNow.timeStart, runtimeState.eventNow.timeEnd, offsetClock);
    if (isNow) {
      runtimeState.timer.startedAt = runtimeState.clock;

      // update runtime
      if (runtimeState.blockNow && runtimeState.blockNow.startedAt === null) {
        runtimeState.blockNow.startedAt = runtimeState.clock;
      }
      if (!runtimeState.runtime.actualStart) {
        runtimeState.runtime.actualStart = runtimeState.clock;
      }
      runtimeState.timer.secondaryTimer = null;
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

  // we need to persist the current block state across loads
  clearEventData();

  //account for offset but we only keep it if passed to us
  runtimeState.runtime.offset = offset;
  const offsetClock = runtimeState.clock + runtimeState.runtime.offset;

  const { index, isPending } = loadRoll(rundown, metadata, offsetClock);

  // load events in memory along with their data
  loadNow(rundown, metadata, index);
  loadNext(rundown, metadata, index);
  loadBlock(rundown);

  // update roll state
  runtimeState.timer.playback = Playback.Roll;
  runtimeState.runtime.numEvents = metadata.timedEventOrder.length;

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

  // there is something to run, load event

  // update runtime
  if (runtimeState.blockNow && runtimeState.blockNow.startedAt === null) {
    runtimeState.blockNow.startedAt = runtimeState.clock;
  }

  // event will finish on time
  // account for event that finishes the day after
  const endTime =
    runtimeState.eventNow.timeEnd < runtimeState.eventNow.timeStart
      ? runtimeState.eventNow.timeEnd + dayInMs
      : runtimeState.eventNow.timeEnd;
  runtimeState.timer.startedAt = runtimeState.clock;
  runtimeState.timer.expectedFinish = endTime;

  // we add time to allow timer to catch up
  runtimeState.timer.addedTime = -(runtimeState.clock - runtimeState.eventNow.timeStart);

  // state catch up
  runtimeState.timer.duration = calculateDuration(runtimeState.eventNow.timeStart, endTime);
  runtimeState.timer.current = getCurrent(runtimeState);
  runtimeState.timer.elapsed = 0;

  // update runtime
  runtimeState.runtime.actualStart = runtimeState.clock;
  return { eventId: runtimeState.eventNow.id, didStart: true };
}

/**
 * handle block loading, not for use outside of runtimeState
 */
export function loadBlock(rundown: Rundown, state = runtimeState) {
  // we need a loaded event to have a block
  if (state.eventNow === null) {
    state.blockNow = null;
    state.blockNext = null;
    return;
  }

  const currentBlockId = state.eventNow.parent;

  // look for potential next block
  let foundEventNow = false;
  for (const id of rundown.order) {
    if (foundEventNow && isOntimeBlock(rundown.entries[id])) {
      state.blockNext = id; // the id is set here, the start time is set in other placed that handel starting events
      break;
    }
    if (id === state.eventNow.id) {
      foundEventNow = true;
      continue;
    }
  }

  // not inside a block
  if (currentBlockId === null) {
    state.blockNow = null;
    return;
  }

  //we went into a new block - and it is different from the one we might have come from
  if ((state.blockNow != null && state.blockNow.id != currentBlockId) || state.blockNow == null) {
    state.blockNow = { id: currentBlockId, startedAt: null, expectedEnd: null }; // the id is set here, the start time is set in other placed that handel starting events
  }
}

/**
 * find and load the next flag from the currently loaded event
 */
export function loadNextFlag(currentIndex: number, rundown: Rundown, metadata: RundownMetadata) {
  runtimeState.nextFlag = null;

  if (metadata.flags.length === 0) {
    return;
  }

  for (let i = currentIndex; i < metadata.timedEventOrder.length; i++) {
    const entryId = metadata.timedEventOrder[i];
    if (metadata.flags.includes(entryId)) {
      const event = rundown.entries[entryId];
      if (!event || !isOntimeEvent(event)) {
        continue;
      }
      runtimeState.nextFlag = { id: event.id, start: event.timeStart };
      return;
    }
  }

  return null;
}

export function setOffsetMode(mode: OffsetMode) {
  runtimeState.runtime.offsetMode = mode;
}
