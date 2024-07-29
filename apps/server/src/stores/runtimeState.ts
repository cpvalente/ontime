import {
  CurrentBlockState,
  MaybeNumber,
  MaybeString,
  OntimeRundown,
  PlayableEvent,
  Playback,
  Runtime,
  TimerPhase,
  TimerState,
} from 'ontime-types';
import { calculateDuration, dayInMs, filterPlayable, getRelevantBlock } from 'ontime-utils';

import { clock } from '../services/Clock.js';
import { RestorePoint } from '../services/RestoreService.js';
import {
  getCurrent,
  getExpectedEnd,
  getExpectedFinish,
  getRuntimeOffset,
  getTimerPhase,
  isPlaybackActive,
} from '../services/timerUtils.js';
import { timerConfig } from '../config/config.js';
import { loadRoll } from '../services/rollUtils.js';

const initialRuntime: Runtime = {
  selectedEventIndex: null, // changes if rundown changes or we load a new event
  numEvents: 0, // change initiated by user
  offset: 0, // changes at runtime
  plannedStart: 0, // only changes if event changes
  plannedEnd: 0, // only changes if event changes
  actualStart: null, // set once we start the timer
  expectedEnd: null, // changes with runtime, based on offset
} as const;

const initialTimer: TimerState = {
  addedTime: 0,
  current: null, // changes on every update
  duration: null, // only changes if event changes
  elapsed: null, // changes on every update
  // TODO: expected finish could account for midnight, we cleanup in the clients
  expectedFinish: null, // change can only be initiated by user
  finishedAt: null, // can change on update or user action
  phase: TimerPhase.None, // can change on update or user action
  playback: Playback.Stop, // change initiated by user
  secondaryTimer: null, // change on every update
  startedAt: null, // change can only be initiated by user
} as const;

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
    forceFinish: MaybeNumber; // wether we should declare an event as finished, will contain the finish time
    totalDelay: number; // this value comes from rundown service
    pausedAt: MaybeNumber;
  };
  _prevCurrentBlock: CurrentBlockState;
};

const runtimeState: RuntimeState = {
  clock: clock.timeNow(),
  currentBlock: {
    block: null,
    startedAt: null,
  },
  eventNow: null,
  publicEventNow: null,
  eventNext: null,
  publicEventNext: null,
  runtime: { ...initialRuntime },
  timer: { ...initialTimer },
  _timer: {
    forceFinish: null,
    totalDelay: 0,
    pausedAt: null,
  },
  _prevCurrentBlock: {
    block: null,
    startedAt: null,
  },
};

export function getState(): Readonly<RuntimeState> {
  return runtimeState;
}

export function clear() {
  runtimeState.eventNow = null;
  runtimeState.publicEventNow = null;
  runtimeState.eventNext = null;

  runtimeState._prevCurrentBlock = { ...runtimeState.currentBlock };
  runtimeState.currentBlock.block = null;
  runtimeState.currentBlock.startedAt = null;

  runtimeState.publicEventNext = null;

  runtimeState.runtime.offset = 0;
  runtimeState.runtime.actualStart = null;
  runtimeState.runtime.expectedEnd = null;
  runtimeState.runtime.selectedEventIndex = null;

  runtimeState.timer.playback = Playback.Stop;
  runtimeState.clock = clock.timeNow();
  runtimeState.timer = { ...initialTimer };

  // we maintain the total delay
  runtimeState._timer.pausedAt = null;
}

/**
 * Utility to allow modifying the state from the outside
 * @param newState
 */
function patchTimer(newState: Partial<TimerState>) {
  for (const key in newState) {
    if (key in runtimeState.timer) {
      runtimeState.timer[key] = newState[key];
    }
  }
}

type RundownData = {
  numEvents: number;
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
  clear();

  // filter rundown
  const playableEvents = filterPlayable(rundown);
  const eventIndex = playableEvents.findIndex((eventInMemory) => eventInMemory.id === event.id);

  if (playableEvents.length === 0 || eventIndex === -1) {
    return false;
  }

  // load events in memory along with their data
  loadNow(playableEvents, eventIndex);
  loadNext(playableEvents, eventIndex);

  // update state
  runtimeState.timer.playback = Playback.Armed;
  runtimeState.timer.duration = calculateDuration(event.timeStart, event.timeEnd);
  runtimeState.timer.current = getCurrent(runtimeState);
  runtimeState.runtime.numEvents = playableEvents.length;

  // patch with potential provided data
  if (initialData) {
    patchTimer(initialData);

    const firstStart = initialData?.firstStart;
    if (firstStart === null || typeof firstStart === 'number') {
      runtimeState.runtime.actualStart = firstStart;
      runtimeState.runtime.offset = getRuntimeOffset(runtimeState);
      runtimeState.runtime.expectedEnd = getExpectedEnd(runtimeState);
    }
  }

  return event.id === runtimeState.eventNow?.id;
}

/**
 * Loads current event and its public counterpart
 */
export function loadNow(
  playableEvents: PlayableEvent[],
  eventIndex: MaybeNumber = runtimeState.runtime.selectedEventIndex,
) {
  if (eventIndex === null) {
    // reset the state to indicate there is no selection
    runtimeState.runtime.selectedEventIndex = null;
    runtimeState.eventNow = null;
    runtimeState.currentBlock.block = null;
    runtimeState.currentBlock.startedAt = null;
    return;
  }

  const event = playableEvents[eventIndex];
  runtimeState.runtime.selectedEventIndex = eventIndex;
  runtimeState.eventNow = event;
  runtimeState.currentBlock.block = getRelevantBlock(playableEvents, event.id);

  // if we are still in the same block keep the startedAt time
  if (runtimeState._prevCurrentBlock.block?.id === runtimeState.currentBlock.block?.id) {
    runtimeState.currentBlock.startedAt = runtimeState._prevCurrentBlock.startedAt;
  }

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
      if (playableEvents[i].isPublic) {
        runtimeState.publicEventNow = playableEvents[i];
        break;
      }
    }
  }
}

/**
 * Loads the next event and its public counterpart
 */
export function loadNext(
  playableEvents: PlayableEvent[],
  eventIndex: MaybeNumber = runtimeState.runtime.selectedEventIndex,
) {
  if (eventIndex === null) {
    // reset the state to indicate there is no future event
    runtimeState.eventNext = null;
    runtimeState.publicEventNext = null;
    return;
  }

  for (let i = eventIndex + 1; i < playableEvents.length; i++) {
    const event = playableEvents[i];
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
export function reload(event?: PlayableEvent): string | undefined {
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

  // TODO: this seems incorrect
  runtimeState.currentBlock.startedAt = null;
  return runtimeState.eventNow.id;
}

/**
 * Used in situations when we want to hot-reload all events without interrupting timer
 */
export function reloadAll(rundown: OntimeRundown) {
  const playableEvents = filterPlayable(rundown);
  loadNow(playableEvents);
  loadNext(playableEvents);
  reload(runtimeState.eventNow ?? undefined);
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
  shouldCallRoll: boolean;
};

export function update(): UpdateResult {
  // 0. there are some things we always do
  runtimeState.clock = clock.timeNow(); // we update the clock on every update call

  // 1. is playback idle?
  if (!isPlaybackActive(runtimeState)) {
    return updateIfIdle();
  }

  // 2. are we waiting to roll?
  if (runtimeState.timer.playback === Playback.Roll && runtimeState.timer.secondaryTimer !== null) {
    return updateIfWaitingToRoll(runtimeState.timer.secondaryTimer);
  }

  // 3. at this point we know that we are playing an event
  // reset data
  runtimeState.timer.secondaryTimer = null;

  // update timer state
  if (!runtimeState.timer.duration) {
    throw new Error('Timer duration is not set');
  }

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
    runtimeState._timer.forceFinish;
    runtimeState.timer.finishedAt = runtimeState._timer.forceFinish ?? runtimeState.clock;
  } else {
    runtimeState.timer.expectedFinish = getExpectedFinish(runtimeState);
  }

  return { hasTimerFinished: finishedNow, shouldCallRoll: finishedNow };

  function updateIfIdle() {
    // if nothing is running, nothing to do
    return { hasTimerFinished: false, shouldCallRoll: false };
  }

  function updateIfWaitingToRoll(targetTime: number) {
    runtimeState.timer.secondaryTimer = targetTime - runtimeState.clock;
    runtimeState.timer.phase = TimerPhase.Pending;
    return { hasTimerFinished: false, shouldCallRoll: runtimeState.timer.secondaryTimer < 0 };
  }
}

// TODO: roll should return a summary of loaded state for integrations
export function roll(rundown: OntimeRundown): { eventId: MaybeString; pending: boolean } {
  // 1. if an event is running, we simply take over the playback
  if (runtimeState.timer.playback === Playback.Play && runtimeState.runtime.selectedEventIndex) {
    runtimeState.timer.playback = Playback.Roll;
    return { eventId: runtimeState.eventNow?.id ?? null, pending: false };
  }

  // 2. if there is no event running, we need to find the next event
  const playableEvents = filterPlayable(rundown);
  if (playableEvents.length === 0) {
    throw new Error('No playable events found');
  }

  clear();
  const { index, isPending } = loadRoll(playableEvents, runtimeState.clock);

  // load events in memory along with their data
  loadNow(playableEvents, index);
  loadNext(playableEvents, index);

  // update roll state
  runtimeState.timer.playback = Playback.Roll;
  runtimeState.runtime.numEvents = playableEvents.length;

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
    const normalisedNextStart =
      runtimeState.eventNow.timeStart < runtimeState.clock
        ? runtimeState.eventNow.timeStart + dayInMs
        : runtimeState.eventNow.timeStart;
    runtimeState.timer.secondaryTimer = normalisedNextStart - runtimeState.clock;
    return { eventId: runtimeState.eventNow.id, pending: false };
  }

  // there is something to run, load event

  // event will finish on time
  // account for event that finishes the day after
  const endTime =
    runtimeState.eventNow.timeEnd < runtimeState.eventNow.timeStart
      ? runtimeState.eventNow.timeEnd + dayInMs
      : runtimeState.eventNow.timeEnd;
  runtimeState.timer.startedAt = runtimeState.clock;
  // TODO: allowing expected finish to overflow may need client changes
  runtimeState.timer.expectedFinish = endTime;

  // we add time to allow timer to catch up
  runtimeState.timer.addedTime = -(runtimeState.clock - runtimeState.eventNow.timeStart);

  // state catch up
  runtimeState.timer.duration = calculateDuration(runtimeState.eventNow.timeStart, endTime);
  runtimeState.timer.current = getCurrent(runtimeState);

  // update runtime
  runtimeState.runtime.actualStart = runtimeState.clock;
  return { eventId: runtimeState.eventNow.id, pending: false };
}
