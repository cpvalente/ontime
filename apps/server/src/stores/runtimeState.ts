import {
  CurrentBlockState,
  isPlayableEvent,
  MaybeNumber,
  MaybeString,
  OntimeEvent,
  OntimeRundown,
  PlayableEvent,
  Playback,
  Runtime,
  runtimeStorePlaceholder,
  TimerPhase,
  TimerState,
} from 'ontime-types';
import {
  calculateDuration,
  checkIsNow,
  dayInMs,
  filterTimedEvents,
  getPreviousBlock,
  isPlaybackActive,
} from 'ontime-utils';

import { clock } from '../services/Clock.js';
import type { RestorePoint } from '../services/RestoreService.js';
import {
  getCurrent,
  getExpectedEnd,
  getExpectedFinish,
  getRuntimeOffset,
  getTimerPhase,
} from '../services/timerUtils.js';
import { timerConfig } from '../config/config.js';
import { loadRoll, normaliseRollStart } from '../services/rollUtils.js';

export type RuntimeState = {
  clock: number; // realtime clock
  eventNow: PlayableEvent | null;
  currentBlock: CurrentBlockState;
  publicEventNow: PlayableEvent | null;
  eventNext: PlayableEvent | null;
  publicEventNext: PlayableEvent | null;
  runtime: Runtime;
  timer: TimerState;
  // private properties of the timer calculations
  _timer: {
    forceFinish: MaybeNumber; // whether we should declare an event as finished, will contain the finish time
    totalDelay: number; // this value comes from rundown service
    pausedAt: MaybeNumber;
    secondaryTarget: MaybeNumber;
  };
};

const runtimeState: RuntimeState = {
  clock: clock.timeNow(),
  currentBlock: { ...runtimeStorePlaceholder.currentBlock },
  eventNow: null,
  publicEventNow: null,
  eventNext: null,
  publicEventNext: null,
  runtime: { ...runtimeStorePlaceholder.runtime },
  timer: { ...runtimeStorePlaceholder.timer },
  _timer: {
    forceFinish: null,
    totalDelay: 0,
    pausedAt: null,
    secondaryTarget: null,
  },
};

export function getState(): Readonly<RuntimeState> {
  // create a shallow copy of the state
  return {
    ...runtimeState,
    eventNow: runtimeState.eventNow ? { ...runtimeState.eventNow } : null,
    eventNext: runtimeState.eventNext ? { ...runtimeState.eventNext } : null,
    publicEventNow: runtimeState.publicEventNow ? { ...runtimeState.publicEventNow } : null,
    publicEventNext: runtimeState.publicEventNext ? { ...runtimeState.publicEventNext } : null,
    runtime: { ...runtimeState.runtime },
    timer: { ...runtimeState.timer },
    _timer: { ...runtimeState._timer },
  };
}

export function clear() {
  runtimeState.eventNow = null;
  runtimeState.publicEventNow = null;
  runtimeState.eventNext = null;

  runtimeState.currentBlock.block = null;
  runtimeState.currentBlock.startedAt = null;

  runtimeState.publicEventNext = null;

  runtimeState.runtime.offset = 0;
  runtimeState.runtime.actualStart = null;
  runtimeState.runtime.expectedEnd = null;
  runtimeState.runtime.selectedEventIndex = null;

  runtimeState.timer.playback = Playback.Stop;
  runtimeState.clock = clock.timeNow();
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
      runtimeState.timer[key] = newState[key];
    } else if (key in runtimeState._timer) {
      // in case of a RestorePoint we will receive a pausedAt value
      // wiche is needed to resume a paused timer
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
  runtimeState._timer.totalDelay = rundownData.totalDelay;

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
  rundown: OntimeRundown,
  initialData?: Partial<TimerState & RestorePoint>,
): boolean {
  report.eventStop(runtimeState);
  // we need to persist the current block state across loads
  const prevCurrentBlock = { ...runtimeState.currentBlock };
  clear();
  runtimeState.currentBlock = prevCurrentBlock;

  // filter rundown
  const timedEvents = filterTimedEvents(rundown);
  const eventIndex = timedEvents.findIndex((eventInMemory) => eventInMemory.id === event.id);

  if (timedEvents.length === 0 || eventIndex === -1 || !isPlayableEvent(event)) {
    return false;
  }

  // load events in memory along with their data
  loadNow(timedEvents, eventIndex);
  loadNext(timedEvents, eventIndex);
  loadBlock(rundown);

  // update state
  runtimeState.timer.playback = Playback.Armed;
  runtimeState.timer.duration = calculateDuration(event.timeStart, event.timeEnd);
  runtimeState.timer.current = getCurrent(runtimeState);
  runtimeState.runtime.numEvents = timedEvents.length;

  // patch with potential provided data
  if (initialData) {
    patchTimer(initialData);
    const firstStart = initialData?.firstStart;
    if (firstStart === null || typeof firstStart === 'number') {
      runtimeState.runtime.actualStart = firstStart;
      runtimeState.runtime.offset = getRuntimeOffset(runtimeState);
      runtimeState.runtime.expectedEnd = getExpectedEnd(runtimeState);
    }
    if (typeof initialData.blockStartAt === 'number') {
      runtimeState.currentBlock.startedAt = initialData.blockStartAt;
    }
  }
  return event.id === runtimeState.eventNow?.id;
}

/**
 * Loads current event and its public counterpart
 */
export function loadNow(timedEvents: OntimeEvent[], eventIndex: MaybeNumber = runtimeState.runtime.selectedEventIndex) {
  if (eventIndex === null) {
    // reset the state to indicate there is no selection
    runtimeState.runtime.selectedEventIndex = null;
    runtimeState.eventNow = null;
    return;
  }

  const event = timedEvents[eventIndex] as PlayableEvent;
  runtimeState.runtime.selectedEventIndex = eventIndex;
  runtimeState.eventNow = event;

  // check if current is also public
  if (event.isPublic) {
    runtimeState.publicEventNow = event;
  } else {
    // assume there is no public event
    runtimeState.publicEventNow = null;

    // if there is nothing before, return
    if (!eventIndex) {
      return;
    }

    // iterate backwards to find it
    for (let i = eventIndex; i >= 0; i--) {
      const event = timedEvents[i];
      // we dont deal with events that are not playable
      if (!isPlayableEvent(event)) {
        continue;
      }

      if (event.isPublic) {
        runtimeState.publicEventNow = event;
        break;
      }
    }
  }
}

/**
 * Loads the next event and its public counterpart
 */
export function loadNext(
  timedEvents: OntimeEvent[],
  eventIndex: MaybeNumber = runtimeState.runtime.selectedEventIndex,
) {
  if (eventIndex === null) {
    // reset the state to indicate there is no future event
    runtimeState.eventNext = null;
    runtimeState.publicEventNext = null;
    return;
  }

  // temporarily reset this value to simplify loop logic
  runtimeState.eventNext = null;

  for (let i = eventIndex + 1; i < timedEvents.length; i++) {
    const event = timedEvents[i];
    // we dont deal with events that are not playable
    if (!isPlayableEvent(event)) {
      continue;
    }

    // the private event is the one immediately after the current event
    if (runtimeState.eventNext === null) {
      runtimeState.eventNext = event;
    }

    // if event is public
    if (event.isPublic) {
      runtimeState.publicEventNext = event;
    }

    // Stop if both are set
    if (runtimeState.eventNext !== null && runtimeState.publicEventNext !== null) {
      return;
    }
  }
}

/**
 * Resume from restore point
 */
export function resume(restorePoint: RestorePoint, event: PlayableEvent, rundown: OntimeRundown) {
  load(event, rundown, restorePoint);
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
export function updateAll(rundown: OntimeRundown) {
  const timedEvents = filterTimedEvents(rundown);
  loadNow(timedEvents);
  loadNext(timedEvents);
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
  state.clock = clock.timeNow();
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
  if (state.currentBlock.startedAt === null) {
    state.currentBlock.startedAt = state.clock;
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
  state.runtime.offset = getRuntimeOffset(state);
  state.runtime.expectedEnd = state.runtime.plannedEnd - state.runtime.offset;

  report.eventStart(runtimeState);
  return true;
}

export function pause(state: RuntimeState = runtimeState): boolean {
  if (state.timer.playback !== Playback.Play) {
    return false;
  }

  state.timer.playback = Playback.Pause;
  state.clock = clock.timeNow();
  state._timer.pausedAt = state.clock;
  return true;
}

export function stop(state: RuntimeState = runtimeState): boolean {
  if (state.timer.playback === Playback.Stop) {
    return false;
  }

  report.eventStop(runtimeState);
  clear();
  runtimeState.runtime.actualStart = null;
  runtimeState.runtime.expectedEnd = null;
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
    runtimeState._timer.forceFinish = clock.timeNow();
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
  runtimeState.runtime.offset = getRuntimeOffset(runtimeState);
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
  runtimeState.clock = clock.timeNow(); // we update the clock on every update call

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
  runtimeState.runtime.offset = getRuntimeOffset(runtimeState);
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

export function roll(rundown: OntimeRundown, offset = 0): { eventId: MaybeString; didStart: boolean } {
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
      if (runtimeState.currentBlock.startedAt === null) {
        runtimeState.currentBlock.startedAt = runtimeState.clock;
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
  const timedEvents = filterTimedEvents(rundown);
  if (timedEvents.length === 0) {
    throw new Error('No playable events found');
  }

  // we need to persist the current block state across loads
  const prevCurrentBlock = { ...runtimeState.currentBlock };
  clear();
  runtimeState.currentBlock = prevCurrentBlock;

  //account for offset but we only keep it if passed to us
  runtimeState.runtime.offset = offset;
  const offsetClock = runtimeState.clock + runtimeState.runtime.offset;

  const { index, isPending } = loadRoll(timedEvents, offsetClock);

  // load events in memory along with their data
  loadNow(timedEvents, index);
  loadNext(timedEvents, index);
  loadBlock(rundown);

  // update roll state
  runtimeState.timer.playback = Playback.Roll;
  runtimeState.runtime.numEvents = timedEvents.length;

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
  if (runtimeState.currentBlock.startedAt === null) {
    runtimeState.currentBlock.startedAt = runtimeState.clock;
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
 * @param rundown
 */
export function loadBlock(rundown: OntimeRundown, state = runtimeState) {
  if (state.eventNow === null) {
    // we need a loaded event to have a block
    state.currentBlock.block = null;
    state.currentBlock.startedAt = null;
    return;
  }

  const newCurrentBlock = getPreviousBlock(rundown, state.eventNow.id);

  // update time only if the block has changed
  if (state.currentBlock.block?.id !== newCurrentBlock?.id) {
    state.currentBlock.startedAt = null;
  }

  // update the block anyway
  state.currentBlock.block = newCurrentBlock === null ? null : { ...newCurrentBlock };
}
