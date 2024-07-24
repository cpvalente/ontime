import {
  CurrentBlockState,
  MaybeNumber,
  OntimeEvent,
  OntimeRundown,
  Playback,
  Runtime,
  TimerPhase,
  TimerState,
} from 'ontime-types';
import { calculateDuration, dayInMs, filterPlayable, getRelevantBlock, millisToString } from 'ontime-utils';

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
import { getRollTimers } from '../services/rollUtils.js';

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
  eventNow: OntimeEvent | null;
  currentBlock: CurrentBlockState;
  publicEventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  publicEventNext: OntimeEvent | null;
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
 * @param event
 * @param {OntimeEvent} event current event to load
 * @param {OntimeRundown} rundown the full rundown
 * @param initialData potential data from restore point
 */
export function load(
  event: OntimeEvent,
  rundown: OntimeRundown,
  initialData?: Partial<TimerState & RestorePoint>,
): boolean {
  clear();

  const eventIndex = rundown.findIndex((eventInMemory) => eventInMemory.id === event.id);

  runtimeState.runtime.selectedEventIndex = eventIndex;

  loadNow(event, rundown);
  loadNext(rundown);

  runtimeState.clock = clock.timeNow();
  runtimeState.timer.playback = Playback.Armed;
  runtimeState.timer.duration = calculateDuration(event.timeStart, event.timeEnd);
  runtimeState.timer.current = getCurrent(runtimeState);

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

export function loadNow(event: OntimeEvent, rundown: OntimeRundown) {
  runtimeState.eventNow = event;
  runtimeState.currentBlock.block = getRelevantBlock(rundown, event.id);

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
    if (!runtimeState.runtime.selectedEventIndex) {
      return;
    }

    const playableEvents = filterPlayable(rundown);

    // iterate backwards to find it
    for (let i = runtimeState.runtime.selectedEventIndex; i >= 0; i--) {
      if (playableEvents[i].isPublic) {
        runtimeState.publicEventNow = playableEvents[i];
        break;
      }
    }
  }
}

export function loadNext(rundown: OntimeRundown) {
  // assume there are no next events
  runtimeState.eventNext = null;
  runtimeState.publicEventNext = null;

  if (runtimeState.runtime.selectedEventIndex === null) {
    return;
  }

  const playableEvents = filterPlayable(rundown);
  const numEvents = playableEvents.length;

  if (runtimeState.runtime.selectedEventIndex < numEvents - 1) {
    let nextPublic = false;
    let nextProduction = false;

    for (let i = runtimeState.runtime.selectedEventIndex + 1; i < numEvents; i++) {
      // if we have not set private
      if (!nextProduction) {
        runtimeState.eventNext = playableEvents[i];
        nextProduction = true;
      }

      // if event is public
      if (playableEvents[i].isPublic) {
        runtimeState.publicEventNext = playableEvents[i];
        nextPublic = true;
      }

      // Stop if both are set
      if (nextPublic && nextProduction) break;
    }
  }
}

/**
 * Resume from restore point
 * @param restorePoint
 * @param event
 * @param playableEvents list of events availebe for playback
 * @param rundown the full rundown
 */
export function resume(restorePoint: RestorePoint, event: OntimeEvent, rundown: OntimeRundown) {
  load(event, rundown, restorePoint);
}

/**
 * We only pass an event if we are hot reloading
 * @param {OntimeEvent} event only passed if we are changing the data if a playing timer
 */
export function reload(event?: OntimeEvent) {
  // we only pass an event for hot reloading, ie: the event has changed
  if (event) {
    runtimeState.eventNow = event;

    // update data which is duplicate between eventNow and timer objects
    runtimeState.timer.duration = calculateDuration(runtimeState.eventNow.timeStart, runtimeState.eventNow.timeEnd);
    runtimeState.timer.current = getCurrent(runtimeState);
    runtimeState.timer.expectedFinish = getExpectedFinish(runtimeState);
    return runtimeState.eventNow.id;
  }
  runtimeState.timer.playback = Playback.Armed;

  runtimeState.timer.duration = calculateDuration(runtimeState.eventNow.timeStart, runtimeState.eventNow.timeEnd);
  runtimeState.timer.current = runtimeState.timer.duration;
  runtimeState.timer.elapsed = null;

  runtimeState.timer.startedAt = null;
  runtimeState.timer.finishedAt = null;
  runtimeState._timer.pausedAt = null;
  runtimeState.timer.addedTime = 0;

  runtimeState.timer.expectedFinish = getExpectedFinish(runtimeState);

  runtimeState.currentBlock.startedAt = null;
  return runtimeState.eventNow.id;
}

/**
 * Used in situations when we want to reload all events
 * without interrupting timer
 * @param eventNow
 * @param playableEvents
 * @param rundown
 */
export function reloadAll(eventNow: OntimeEvent, rundown: OntimeRundown) {
  loadNow(eventNow, rundown);
  loadNext(rundown);
  reload(eventNow);
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
    console.log('currentBlock.startedAt is null, setting new start');
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

export function addTime(amount: number) {
  if (runtimeState.timer.current === null) {
    return false;
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
export function roll(rundown: OntimeRundown) {
  // 1. if an event is running, we simply take over the playback
  if (runtimeState.timer.playback === Playback.Play && runtimeState.runtime.selectedEventIndex) {
    runtimeState.timer.playback = Playback.Roll;
    return;
  }

  // 2. if there is no event running, we need to find the next event
  const playableEvents = filterPlayable(rundown);
  if (playableEvents.length === 0) {
    throw new Error('No playable events found');
  }

  clear();
  const { currentEvent, currentPublicEvent, nextEvent, nextPublicEvent, nextIndex, nowIndex } = getRollTimers(
    playableEvents,
    runtimeState.clock,
  );

  runtimeState.timer.playback = Playback.Roll;
  runtimeState.runtime.numEvents = playableEvents.length;
  runtimeState.eventNow = currentEvent;
  runtimeState.publicEventNow = currentPublicEvent;
  runtimeState.eventNext = nextEvent;
  runtimeState.publicEventNext = nextPublicEvent;
  runtimeState.runtime.selectedEventIndex = nowIndex;

  // nothing now, but something coming up
  if (!runtimeState.eventNow && runtimeState.eventNext) {
    // TODO: new stuff we want to change
    // TODO: 1. when we are waiting, we load the event
    runtimeState.runtime.selectedEventIndex = nextIndex;
    runtimeState.eventNow = nextEvent;

    // count down to event start
    runtimeState.timer.phase = TimerPhase.Pending;
    const normalisedNextStart =
      runtimeState.eventNext.timeStart < runtimeState.clock
        ? runtimeState.eventNext.timeStart + dayInMs
        : runtimeState.eventNext.timeStart;
    runtimeState.timer.secondaryTimer = normalisedNextStart - runtimeState.clock;

    return;
  }

  // eslint-disable-next-line no-unused-labels -- dev code path
  DEV: {
    if (runtimeState.eventNow === null) {
      throw new Error('runtimeState.roll: invalid state received');
    }
  }

  // there is something to run, load event
  // account for event that finishes the day after
  const endTime =
    runtimeState.eventNow.timeEnd < runtimeState.eventNow.timeStart
      ? runtimeState.eventNow.timeEnd + dayInMs
      : runtimeState.eventNow.timeEnd;

  // TODO: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // TODO: Need to create a load specific to roll
  // TODO: We could reuse the load() but I am unsure whether generalising is a good idea
  // TODO: - needs to setup time correctly (add time to match clock)
  // TODO: - needs to load events, with the specific case of loading the next event if we are waiting
  // TODO: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  loadRoll: {
    // new stuff
    // event started now
    runtimeState.timer.startedAt = runtimeState.clock;
    // TODO: do we need to set actual start?

    // event will finish on time
    // TODO: allowing expected finish to overflow may need client changes
    runtimeState.timer.expectedFinish = endTime;

    // we add time to allow timer to catch up
    runtimeState.timer.addedTime = -(runtimeState.clock - runtimeState.eventNow.timeStart);

    // state catch up
    runtimeState.timer.elapsed = 0;

    // from load() <---------------
    runtimeState.timer.duration = calculateDuration(runtimeState.eventNow.timeStart, endTime);
    runtimeState.timer.current = getCurrent(runtimeState);

    // from loadNow() <---------------
    runtimeState.currentBlock.block = getRelevantBlock(rundown, runtimeState.eventNow.id);
    // if we are still in the same block keep the startedAt time
    if (runtimeState._prevCurrentBlock.block?.id === runtimeState.currentBlock.block?.id) {
      runtimeState.currentBlock.startedAt = runtimeState._prevCurrentBlock.startedAt;
    }

    // more new stuff, needs to be done after things are loaded
    runtimeState.timer.phase = getTimerPhase(runtimeState);
  }
}
