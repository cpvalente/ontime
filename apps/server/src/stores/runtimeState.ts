import { Runtime, OntimeEvent, Playback, TimerState, TimerType, MaybeNumber } from 'ontime-types';
import { calculateDuration, dayInMs } from 'ontime-utils';

import { clock } from '../services/Clock.js';
import { RestorePoint } from '../services/RestoreService.js';
import { getCurrent, getExpectedFinish, getRollTimers, skippedOutOfEvent, updateRoll } from '../services/timerUtils.js';
import { EventLoader } from '../classes/event-loader/EventLoader.js';

// TODO: move to timer config
const timeSkipLimit = 1000;

const initialRuntime: Runtime = {
  selectedEventIndex: null,
  numEvents: 0,
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

// TODO: could we avoid having this dependency?
/**
 * Utility to reset the state
 * @param numEvents DI for testing
 */
export function clear(numEvents: number = EventLoader.getPlayableEvents().length) {
  // TODO: check that entire state is reset here
  runtimeState.eventNow = null;
  runtimeState.publicEventNow = null;
  runtimeState.eventNext = null;
  runtimeState.publicEventNext = null;

  runtimeState.runtime = { ...initialRuntime };
  runtimeState.runtime.numEvents = numEvents;

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
 * Loads a given event into state
 * @param event
 * @param rundown
 * @param initialData
 */
export function load(event: OntimeEvent, rundown: OntimeEvent[], initialData?: Partial<TimerState>) {
  clear(rundown.length);

  const eventIndex = rundown.findIndex((eventInMemory) => eventInMemory.id === event.id);

  runtimeState.runtime.selectedEventIndex = eventIndex;
  runtimeState.runtime.numEvents = rundown.length;

  this.loadNow(event, rundown);
  this.loadNext(rundown);

  runtimeState.clock = clock.timeNow();
  runtimeState.timer.playback = Playback.Armed;
  runtimeState.timer.duration = calculateDuration(event.timeStart, event.timeEnd);
  runtimeState.timer.current = getCurrent(runtimeState);

  if (initialData) {
    patchTimer(initialData);
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

export function updateNumEvents(numEvents: number) {
  runtimeState.runtime.numEvents = numEvents;
}

export function start(state: RuntimeState = runtimeState) {
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
  return true;
}

export function stop() {
  clear();
}

export function pause() {
  if (runtimeState.timer.playback !== Playback.Play) {
    return false;
  }

  runtimeState.timer.playback = Playback.Pause;
  runtimeState.clock = clock.timeNow();
  runtimeState._timer.pausedAt = runtimeState.clock;
  return true;
}

export function addTime(amount: number) {
  // TODO: what kind of validation go here or in the consumer?
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
}

export function update(force: boolean, updateInterval: number) {
  function roll() {
    const hasSkippedOutOfEvent = skippedOutOfEvent(runtimeState, previousTime, timeSkipLimit);
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

  // TODO: should this logic be moved up?
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
}

export function roll(rundown: OntimeEvent[]) {
  clear();

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
