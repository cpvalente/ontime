import {
  BlockState,
  MaybeNumber,
  OntimeEvent,
  OntimeRundown,
  Playback,
  Runtime,
  TimerPhase,
  TimerState,
  TimerType,
} from 'ontime-types';
import { calculateDuration, dayInMs, getRelevantBlock } from 'ontime-utils';

import { clock } from '../services/Clock.js';
import { RestorePoint } from '../services/RestoreService.js';

import {
  getCurrent,
  getExpectedEnd,
  getExpectedFinish,
  getRollTimers,
  getRuntimeOffset,
  getTimerPhase,
  skippedOutOfEvent,
  updateRoll,
} from '../services/timerUtils.js';
import { timerConfig } from '../config/config.js';

const initialRuntime: Runtime = {
  selectedEventIndex: null,
  numEvents: 0,
  offset: null,
  plannedStart: 0,
  plannedEnd: 0,
  actualStart: null,
  expectedEnd: null,
} as const;

const initialTimer: TimerState = {
  addedTime: 0,
  current: null,
  duration: null,
  elapsed: null,
  expectedFinish: null, // TODO: expected finish could account for midnight, we cleanup in the clients
  finishedAt: null,
  phase: TimerPhase.None,
  playback: Playback.Stop,
  secondaryTimer: null,
  startedAt: null,
} as const;

export type RuntimeState = {
  clock: number; // realtime clock
  eventNow: OntimeEvent | null;
  blockState: BlockState;
  publicEventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  publicEventNext: OntimeEvent | null;
  runtime: Runtime;
  timer: TimerState;
  // private properties of the timer calculations
  _timer: {
    forceFinish: MaybeNumber;
    totalDelay: number; // this value comes from rundown service
    pausedAt: MaybeNumber;
    secondaryTarget: MaybeNumber;
  };
};

const runtimeState: RuntimeState = {
  clock: clock.timeNow(),
  blockState: {
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
    secondaryTarget: null,
  },
};

export function getState(): Readonly<RuntimeState> {
  return runtimeState;
}

export function clear() {
  runtimeState.eventNow = null;
  runtimeState.publicEventNow = null;
  runtimeState.eventNext = null;
  runtimeState.blockState.block = null;
  runtimeState.blockState.startedAt = null;
  runtimeState.publicEventNext = null;

  runtimeState.runtime.offset = null;
  runtimeState.runtime.actualStart = null;
  runtimeState.runtime.expectedEnd = null;
  runtimeState.runtime.selectedEventIndex = null;

  runtimeState.timer.playback = Playback.Stop;
  runtimeState.clock = clock.timeNow();
  runtimeState.timer = { ...initialTimer };

  // we maintain the total delay
  runtimeState._timer.pausedAt = null;
  runtimeState._timer.secondaryTarget = null;
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
  runtimeState.runtime.plannedEnd = rundownData.firstStart + rundownData.totalDuration;
  runtimeState.runtime.expectedEnd = getExpectedEnd(runtimeState);
}

/**
 * Loads a given event into state
 * @param event
 * @param {OntimeEvent[]} playableEvents list of events availebe for playback
 * @param {OntimeRundown} rundown the full rundown
 * @param initialData potential data from restore point
 */
export function load(
  event: OntimeEvent,
  playableEvents: OntimeEvent[],
  rundown: OntimeRundown,
  initialData?: Partial<TimerState & RestorePoint>,
): boolean {
  clear();

  const eventIndex = rundown.findIndex((eventInMemory) => eventInMemory.id === event.id);

  runtimeState.runtime.selectedEventIndex = eventIndex;

  loadNow(event, playableEvents, rundown);
  loadNext(playableEvents);

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

export function loadNow(event: OntimeEvent, playableEvents: OntimeEvent[], rundown: OntimeRundown) {
  runtimeState.eventNow = event;
  runtimeState.blockState.block = getRelevantBlock(rundown, event.id);

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

/**
 * Resume from restore point
 * @param restorePoint
 * @param event
 * @param playableEvents list of events availebe for playback
 * @param rundown the full rundown
 */
export function resume(
  restorePoint: RestorePoint,
  event: OntimeEvent,
  playableEvents: OntimeEvent[],
  rundown: OntimeRundown,
) {
  load(event, playableEvents, rundown, restorePoint);
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

  runtimeState.blockState.startedAt = null;
}

/**
 * Used in situations when we want to reload all events
 * without interrupting timer
 * @param eventNow
 * @param playableEvents
 * @param rundown
 */
export function reloadAll(eventNow: OntimeEvent, playableEvents: OntimeEvent[], rundown: OntimeRundown) {
  loadNow(eventNow, playableEvents, rundown);
  loadNext(playableEvents);
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

  if (state.blockState.startedAt === null) {
    state.blockState.startedAt = state.clock;
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
  let hasTimerFinished = false;
  let shouldCallRoll = false; // we also need to call roll if a secondary timer has finished

  const previousTime = runtimeState.clock;
  runtimeState.clock = clock.timeNow();

  // we call integrations if we update timers
  if (runtimeState.timer.playback === Playback.Roll) {
    const result = onRollUpdate();
    shouldCallRoll = result.doRoll;
    hasTimerFinished = result.isFinished;
  } else if (runtimeState.timer.startedAt !== null) {
    // we only update timer if a timer has been started
    const result = onPlayUpdate();
    hasTimerFinished = result.isFinished;
  } else if (runtimeState.eventNow?.timerType === TimerType.TimeToEnd) {
    // or if we are in a time-to-end timer
    runtimeState.timer.current = getCurrent(runtimeState);
    runtimeState.timer.duration = runtimeState.timer.current;
  }

  // update timer phase
  runtimeState.timer.phase = getTimerPhase(runtimeState);

  // update offset
  runtimeState.runtime.offset = getRuntimeOffset(runtimeState);
  runtimeState.runtime.expectedEnd = getExpectedEnd(runtimeState);

  return {
    hasTimerFinished,
    shouldCallRoll,
  };

  function onRollUpdate() {
    const hasSkippedOutOfEvent = skippedOutOfEvent(runtimeState, previousTime, timerConfig.skipLimit);
    if (hasSkippedOutOfEvent) {
      return { doRoll: true };
    }
    const { updatedTimer, updatedSecondaryTimer, doRollLoad, isFinished } = updateRoll(runtimeState);
    runtimeState.timer.current = updatedTimer;
    runtimeState.timer.secondaryTimer = updatedSecondaryTimer;
    runtimeState.timer.elapsed = runtimeState.timer.duration - runtimeState.timer.current;

    return { doRoll: doRollLoad, isFinished };
  }

  function onPlayUpdate() {
    let isFinished = false;
    runtimeState.timer.current = getCurrent(runtimeState);
    const shouldForceFinish = runtimeState._timer.forceFinish !== null;
    const finishedNow =
      shouldForceFinish ||
      (runtimeState.timer.current <= timerConfig.triggerAhead && runtimeState.timer.finishedAt === null);

    if (runtimeState.timer.playback === Playback.Play && finishedNow) {
      runtimeState.timer.finishedAt = runtimeState._timer.forceFinish ?? runtimeState.clock;
      isFinished = true;
    } else {
      runtimeState.timer.expectedFinish = getExpectedFinish(runtimeState);
    }

    if (shouldForceFinish) {
      runtimeState._timer.forceFinish = null;
    }
    runtimeState.timer.elapsed = runtimeState.timer.duration - runtimeState.timer.current;

    return { isFinished };
  }
}

export function roll(playableEvents: OntimeEvent[], rundown: OntimeRundown) {
  const selectedEventIndex = runtimeState.runtime.selectedEventIndex;
  clear();
  runtimeState.runtime.numEvents = playableEvents.length;

  const { nextEvent, currentEvent } = getRollTimers(playableEvents, runtimeState.clock, selectedEventIndex);

  if (currentEvent) {
    // there is something running, load
    runtimeState.timer.secondaryTimer = null;
    runtimeState._timer.secondaryTarget = null;

    // account for event that finishes the day after
    const endTime =
      currentEvent.timeEnd < currentEvent.timeStart ? currentEvent.timeEnd + dayInMs : currentEvent.timeEnd;

    // when we load a timer in roll, we do the same things as before
    // but also pre-populate some data as to the running state
    load(currentEvent, playableEvents, rundown, {
      startedAt: currentEvent.timeStart,
      expectedFinish: currentEvent.timeEnd,
      current: endTime - runtimeState.clock,
    });
  } else if (nextEvent) {
    if (nextEvent.isPublic) {
      runtimeState.publicEventNext = nextEvent;
    }
    runtimeState.eventNext = nextEvent;
    // account for day after
    const nextStart = nextEvent.timeStart < runtimeState.clock ? nextEvent.timeStart + dayInMs : nextEvent.timeStart;
    // nothing now, but something coming up
    runtimeState.timer.secondaryTimer = nextStart - runtimeState.clock;
    runtimeState._timer.secondaryTarget = nextStart;
  }

  runtimeState.timer.playback = Playback.Roll;
}
