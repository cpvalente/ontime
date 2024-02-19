import { Runtime, OntimeEvent, Playback, TimerState, TimerType, MaybeNumber } from 'ontime-types';
import { calculateDuration, dayInMs, getFirstEvent, getLastEvent } from 'ontime-utils';

import { clock } from '../services/Clock.js';
import { RestorePoint } from '../services/RestoreService.js';
import { getPlayableEvents } from '../services/rundown-service/RundownService.js';
import {
  getCurrent,
  getExpectedFinish,
  getRollTimers,
  getRuntimeOffset,
  skippedOutOfEvent,
  updateRoll,
} from '../services/timerUtils.js';
import { timerConfig } from '../config/config.js';

const initialRuntime: Runtime = {
  selectedEventIndex: null,
  numEvents: 0,
  offset: 0,
  plannedStart: 0,
  plannedEnd: 0,
  actualStart: null,
  expectedEnd: null,
};

const initialTimer: TimerState = {
  addedTime: 0,
  current: null,
  duration: null,
  elapsed: null,
  expectedFinish: null, // TODO: expected finish could account for midnight, we cleanup in the clients
  finishedAt: null,
  playback: Playback.Stop,
  secondaryTimer: null,
  startedAt: null,
};

export type RuntimeState = {
  clock: number; // realtime clock
  eventNow: OntimeEvent | null;
  publicEventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  publicEventNext: OntimeEvent | null;
  runtime: Runtime;
  timer: TimerState;
  // private properties of the timer calculations
  _timer: {
    pausedAt: MaybeNumber;
    finishedNow: boolean;
    lastUpdate: MaybeNumber;
    secondaryTarget: MaybeNumber;
  };
};

const runtimeState: RuntimeState = {
  clock: clock.timeNow(),
  eventNow: null,
  publicEventNow: null,
  eventNext: null,
  publicEventNext: null,
  runtime: initialRuntime,
  timer: { ...initialTimer },
  _timer: {
    pausedAt: null,
    lastUpdate: null,
    secondaryTarget: null,
    get finishedNow() {
      return this.current <= 0 && this.finishedAt === null;
    },
  },
};

export function getState(): Readonly<RuntimeState> {
  return runtimeState;
}

export function clear() {
  runtimeState.eventNow = null;
  runtimeState.publicEventNow = null;
  runtimeState.eventNext = null;
  runtimeState.publicEventNext = null;

  runtimeState.runtime = { ...initialRuntime, actualStart: runtimeState.runtime.actualStart };
  // TODO: can we cleanup the initialisation of runtime state?
  runtimeState.runtime.numEvents = fetchNumEvents();

  runtimeState.timer.playback = Playback.Stop;
  runtimeState.clock = clock.timeNow();
  runtimeState.timer = { ...initialTimer };
  runtimeState._timer = {
    pausedAt: null,
    lastUpdate: null,
    secondaryTarget: null,
    finishedNow: false,
  };
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

/**
 * Utility, getches number of events from EventLoader
 * @param numEvents
 */
function fetchNumEvents(): number {
  // TODO: could we avoid having this dependency?
  return getPlayableEvents().length;
}

/**
 * Utility, allows updating data derived from the rundown
 * @param numEvents
 */
export function updateRundownData(playableRundown: OntimeEvent[]) {
  runtimeState.runtime.numEvents = playableRundown.length;

  const { firstEvent } = getFirstEvent(playableRundown);
  const { lastEvent } = getLastEvent(playableRundown);

  runtimeState.runtime.plannedStart = firstEvent?.timeStart ?? null;
  runtimeState.runtime.plannedEnd = lastEvent?.timeEnd ?? null;
}

/**
 * Loads a given event into state
 * @param event
 * @param rundown
 * @param initialData
 */
export function load(event: OntimeEvent, rundown: OntimeEvent[], initialData?: Partial<TimerState & RestorePoint>) {
  clear();

  updateRundownData(rundown);

  const eventIndex = rundown.findIndex((eventInMemory) => eventInMemory.id === event.id);

  runtimeState.runtime.selectedEventIndex = eventIndex;
  runtimeState.runtime.numEvents = rundown.length;

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
      runtimeState.runtime.expectedEnd = runtimeState.runtime.plannedEnd + runtimeState.runtime.offset;
    }
  }
}

export function loadNow(event: OntimeEvent, playableEvents: OntimeEvent[]) {
  runtimeState.eventNow = event;

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

    // iterate backwards to find it
    for (let i = runtimeState.runtime.selectedEventIndex; i >= 0; i--) {
      if (playableEvents[i].isPublic) {
        runtimeState.publicEventNow = playableEvents[i];
        break;
      }
    }
  }
}

export function loadNext(playableEvents: OntimeEvent[]) {
  // assume there are no next events
  runtimeState.eventNext = null;
  runtimeState.publicEventNext = null;

  if (runtimeState.runtime.selectedEventIndex === null) {
    return;
  }

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

export function resume(restorePoint: RestorePoint, event: OntimeEvent, rundown: OntimeEvent[]) {
  load(event, rundown, restorePoint);
}

/**
 * We only pass an event if we are hot reloading
 * @param {OntimeEvent} event only passed if we are changing the data if a playing timer
 */
export function reload(event?: OntimeEvent) {
  if (event) {
    runtimeState.eventNow = event;

    // update data which is duplicate between eventNow and timer objects
    runtimeState.timer.duration = calculateDuration(runtimeState.eventNow.timeStart, runtimeState.eventNow.timeEnd);
    runtimeState.timer.current = getCurrent(runtimeState);
    runtimeState.timer.expectedFinish = getExpectedFinish(runtimeState);
    return;
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
  state._timer.secondaryTarget = null;

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

  // update runtime delays: over - under
  if (state.runtime.actualStart === null) {
    state.runtime.actualStart = state.clock;
  }

  state.runtime.offset = getRuntimeOffset(state);
  state.runtime.expectedEnd = state.runtime.plannedEnd + state.runtime.offset;

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
  runtimeState.runtime.actualStart = null;
  clear();
  return true;
}

export function addTime(amount: number) {
  if (runtimeState.timer.current === null) {
    return false;
  }

  runtimeState.timer.addedTime += amount;
  runtimeState.timer.expectedFinish += amount;
  runtimeState.timer.current += amount;

  // handle edge cases
  const willGoNegative = amount < 0 && Math.abs(amount) > runtimeState.timer.current;
  const hasFinished = runtimeState.timer.finishedAt !== null;
  if (willGoNegative && !hasFinished) {
    runtimeState.timer.finishedAt = clock.timeNow();
  } else {
    const willGoPositive = runtimeState.timer.current < 0 && runtimeState.timer.current + amount > 0;
    if (willGoPositive) {
      runtimeState.timer.finishedAt = null;
    }
  }

  // update runtime delays: over - under
  runtimeState.runtime.offset = getRuntimeOffset(runtimeState);
  runtimeState.runtime.expectedEnd = runtimeState.runtime.plannedEnd + runtimeState.runtime.offset;
  return true;
}

export function update(force: boolean, updateInterval: number) {
  // TODO: should this logic be moved to consumer?
  // force indicates whether the state change should be broadcast to socket
  let _force = force;
  let _didUpdate = false;
  let _doRoll = false;
  let _isFinished = false;
  let _shouldNotify = false;

  const previousTime = runtimeState.clock;
  runtimeState.clock = clock.timeNow();
  const hasSkippedBack = previousTime > runtimeState.clock;

  if (hasSkippedBack) {
    _force = true;
  }

  // update offset
  runtimeState.runtime.offset = getRuntimeOffset(runtimeState);

  // we call integrations if we update timers
  if (runtimeState.timer.playback === Playback.Roll) {
    const result = roll();
    _shouldNotify = true;
    _doRoll = result.doRoll;
    _isFinished = result.isFinished;
  } else if (runtimeState.timer.startedAt !== null) {
    // we only update timer if a timer has been started
    const result = play();
    _shouldNotify = true;
    _isFinished = result.isFinished;
  } else if (runtimeState.eventNow?.timerType === TimerType.TimeToEnd) {
    // or if we are in a time-to-end timer
    runtimeState.timer.current = getCurrent(runtimeState);
    runtimeState.timer.duration = runtimeState.timer.current;
  }

  // we only update the store at the updateInterval
  // side effects such as onFinish will still be triggered in the update functions
  const isTimeToUpdate = runtimeState.clock > runtimeState._timer.lastUpdate + updateInterval;
  if (_force || isTimeToUpdate) {
    runtimeState._timer.lastUpdate = runtimeState.clock;
    // TODO: can we simplify the didUpdate and shouldNotify
    _didUpdate = true;
  }

  return {
    didUpdate: _didUpdate,
    doRoll: _doRoll,
    isFinished: _isFinished,
    shouldNotify: _shouldNotify,
  };

  function roll() {
    const hasSkippedOutOfEvent = skippedOutOfEvent(runtimeState, previousTime, timerConfig.timeSkipLimit);
    if (hasSkippedOutOfEvent) {
      return { doRoll: true };
    }
    const { updatedTimer, updatedSecondaryTimer, doRollLoad, isFinished } = updateRoll(runtimeState);
    runtimeState.timer.current = updatedTimer;
    runtimeState.timer.secondaryTimer = updatedSecondaryTimer;
    runtimeState.timer.elapsed = runtimeState.timer.duration - runtimeState.timer.current;

    return { doRoll: doRollLoad, isFinished };
  }

  function play() {
    let isFinished = false;
    runtimeState.timer.current = getCurrent(runtimeState);

    if (runtimeState.timer.playback === Playback.Play && runtimeState._timer.finishedNow) {
      runtimeState.timer.finishedAt = runtimeState.clock;
      isFinished = true;
    } else {
      runtimeState.timer.expectedFinish = getExpectedFinish(runtimeState);
    }

    runtimeState.timer.elapsed = runtimeState.timer.duration - runtimeState.timer.current;

    return { isFinished };
  }
}

export function roll(rundown: OntimeEvent[]) {
  clear();

  runtimeState.runtime.numEvents = rundown.length;
  const { nextEvent, currentEvent } = getRollTimers(rundown, runtimeState.clock);

  if (currentEvent) {
    // there is something running, load
    runtimeState.timer.secondaryTimer = null;
    runtimeState._timer.secondaryTarget = null;

    // account for event that finishes the day after
    const endTime =
      currentEvent.timeEnd < currentEvent.timeStart ? currentEvent.timeEnd + dayInMs : currentEvent.timeEnd;

    // when we load a timer in roll, we do the same things as before
    // but also pre-populate some data as to the running state
    load(currentEvent, rundown, {
      startedAt: currentEvent.timeStart,
      expectedFinish: currentEvent.timeEnd,
      current: endTime - runtimeState.clock,
    });
  } else if (nextEvent) {
    // account for day after
    const nextStart = nextEvent.timeStart < runtimeState.clock ? nextEvent.timeStart + dayInMs : nextEvent.timeStart;
    // nothing now, but something coming up
    runtimeState.timer.secondaryTimer = nextStart - runtimeState.clock;
    runtimeState._timer.secondaryTarget = nextStart;
  }

  runtimeState.timer.playback = Playback.Roll;
}