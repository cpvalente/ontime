import type { DeepReadonly, DeepWritable } from 'ts-essentials';

import {
  EndAction,
  Runtime,
  OntimeEvent,
  Playback,
  TimerLifeCycle,
  TimerState,
  TimerType,
  MaybeNumber,
} from 'ontime-types';
import { calculateDuration, dayInMs } from 'ontime-utils';

import { clock } from './services/Clock.js';
import { RestorePoint, restoreService } from './services/RestoreService.js';
import { getCurrent, getExpectedFinish, getRollTimers, skippedOutOfEvent, updateRoll } from './services/timerUtils.js';
import { eventStore } from './stores/EventStore.js';
import { integrationService } from './services/integration-service/IntegrationService.js';
import { runtimeService } from './services/runtime-service/RuntimeService.js';
import { EventLoader } from './classes/event-loader/EventLoader.js';

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

export type TState = DeepReadonly<{
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
}>;

export const state: TState = {
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

export const stateMutations = {
  load(event: OntimeEvent, rundown: OntimeEvent[], initialData?: Partial<TimerState>) {
    mutate((state) => {
      stateMutations.timer.clear();

      const eventIndex = rundown.findIndex((eventInMemory) => eventInMemory.id === event.id);

      state.runtime.selectedEventIndex = eventIndex;
      state.runtime.numEvents = rundown.length;

      this.loadNow(event, rundown);
      this.loadNext(rundown);

      state.clock = clock.timeNow();
      state.timer.playback = Playback.Armed;
      state.timer.duration = calculateDuration(event.timeStart, event.timeEnd);
      state.timer.current = getCurrent(state);

      if (initialData) {
        stateMutations.timer.patch(initialData);
      }
    });
  },
  loadNow(event: OntimeEvent, playableEvents: OntimeEvent[]) {
    mutate((state) => {
      state.eventNow = event;

      // check if current is also public
      if (event.isPublic) {
        state.publicEventNow = event;
      } else {
        // assume there is no public event
        state.publicEventNow = null;

        // if there is nothing before, return
        if (!state.runtime.selectedEventIndex) {
          return;
        }

        // iterate backwards to find it
        for (let i = state.runtime.selectedEventIndex; i >= 0; i--) {
          if (playableEvents[i].isPublic) {
            state.publicEventNow = playableEvents[i];
            break;
          }
        }
      }
    });
  },
  loadNext(playableEvents: OntimeEvent[]) {
    mutate((state) => {
      // assume there are no next events
      state.eventNext = null;
      state.publicEventNext = null;

      if (state.runtime.selectedEventIndex === null) {
        return;
      }

      const numEvents = playableEvents.length;

      if (state.runtime.selectedEventIndex < numEvents - 1) {
        let nextPublic = false;
        let nextProduction = false;

        for (let i = state.runtime.selectedEventIndex + 1; i < numEvents; i++) {
          // if we have not set private
          if (!nextProduction) {
            state.eventNext = playableEvents[i];
            nextProduction = true;
          }

          // if event is public
          if (playableEvents[i].isPublic) {
            state.publicEventNext = playableEvents[i];
            nextPublic = true;
          }

          // Stop if both are set
          if (nextPublic && nextProduction) break;
        }
      }
    });
  },
  resume(restorePoint: RestorePoint, event: OntimeEvent, rundown: OntimeEvent[]) {
    mutate((_state) => {
      stateMutations.load(event, rundown, restorePoint);
    });
  },
  /**
   * We only pass an event if we are hot reloading
   * @param {OntimeEvent} event only passed if we are changing the data if a playing timer
   */
  reload(event?: OntimeEvent) {
    mutate((state) => {
      if (event) {
        state.eventNow = event;

        // update data which is duplicate between eventNow and timer objects
        state.timer.duration = calculateDuration(state.eventNow.timeStart, state.eventNow.timeEnd);
        state.timer.current = getCurrent(state);
        state.timer.expectedFinish = getExpectedFinish(state);
        return;
      }
      state.timer.playback = Playback.Armed;

      state.timer.duration = calculateDuration(state.eventNow.timeStart, state.eventNow.timeEnd);
      state.timer.current = state.timer.duration;
      state.timer.elapsed = null;

      state.timer.startedAt = null;
      state.timer.finishedAt = null;
      state._timer.pausedAt = null;
      state.timer.addedTime = 0;

      state.timer.expectedFinish = getExpectedFinish(state);
    });
  },
  updateNumEvents(numEvents: number) {
    mutate((state) => {
      state.runtime.numEvents = numEvents;
    });
  },
  timer: {
    // utility to reset the state of the timer
    // TODO: create smaller utilities to reset parts of the state
    clear() {
      mutate((state) => {
        // TODO: check that entire state is reset here
        state.eventNow = null;
        state.publicEventNow = null;
        state.eventNext = null;
        state.publicEventNext = null;

        state.runtime = { ...initialRuntime };
        // TODO: could we avoid having this dependency?
        state.runtime.numEvents = EventLoader.getPlayableEvents().length;

        state.timer.playback = Playback.Stop;
        state.clock = clock.timeNow();
        state.timer = { ...initialTimer };
        state._timer = {
          pausedAt: null,
          lastUpdate: null,
          secondaryTarget: null,
          finishedNow: false,
        };
      });
    },
    /** utility to allow modifying the state from the outside */
    patch(timer: Partial<TimerState>) {
      mutate((state) => {
        for (const key in timer) {
          if (key in state.timer) {
            state.timer[key] = timer[key];
          }
        }
      });
    },
    start() {
      mutate(
        (state) => {
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
        },
        {
          sideEffect() {
            integrationService.dispatch(TimerLifeCycle.onStart);
          },
        },
      );
    },
    stop() {
      mutate(
        (_state) => {
          stateMutations.timer.clear();
        },
        {
          sideEffect() {
            integrationService.dispatch(TimerLifeCycle.onStop);
          },
        },
      );
    },
    pause() {
      mutate(
        (state) => {
          if (state.timer.playback !== Playback.Play) {
            return false;
          }

          state.timer.playback = Playback.Pause;
          state.clock = clock.timeNow();
          state._timer.pausedAt = state.clock;
          return true;
        },
        {
          sideEffect(hasChanged: boolean) {
            if (hasChanged) {
              integrationService.dispatch(TimerLifeCycle.onPause);
            }
          },
        },
      );
    },
    resume(event: OntimeEvent, restorePoint: RestorePoint) {
      mutate((state) => {
        state.clock = clock.timeNow();

        state.timer.startedAt = restorePoint.startedAt;
        state.timer.duration = calculateDuration(event.timeStart, event.timeEnd);
        state.timer.current = state.timer.duration;

        state.timer.playback = restorePoint.playback;
        state._timer.pausedAt = restorePoint.pausedAt;
        state.timer.addedTime = restorePoint.addedTime;

        // check if event finished meanwhile
        if (event.timerType === TimerType.TimeToEnd) {
          state.timer.current = getCurrent(state);
        }
      });
    },
    addTime(amount: number) {
      mutate((state) => {
        // TODO: what kind of validation go here or in the consumer?
        state.timer.addedTime += amount;
        state.timer.expectedFinish += amount;
        state.timer.current += amount;

        // handle edge cases
        const willGoNegative = amount < 0 && Math.abs(amount) > state.timer.current;
        const hasFinished = state.timer.finishedAt !== null;
        if (willGoNegative && !hasFinished) {
          state.timer.finishedAt = clock.timeNow();
        } else {
          const willGoPositive = state.timer.current < 0 && state.timer.current + amount > 0;
          if (willGoPositive) {
            state.timer.finishedAt = null;
          }
        }
      });
    },
    // TODO: make options an object ??? maybe we can remove the options altogether?
    // TODO: should we have a semaphore to stop update while other things are running?
    update(force: boolean, updateInterval: number) {
      return mutate(
        (state) => {
          function roll() {
            const hasSkippedOutOfEvent = skippedOutOfEvent(state, previousTime, timeSkipLimit);
            if (hasSkippedOutOfEvent) {
              return { doRoll: true };
            }
            const { updatedTimer, updatedSecondaryTimer, doRollLoad, isFinished } = updateRoll(state);
            state.timer.current = updatedTimer;
            state.timer.secondaryTimer = updatedSecondaryTimer;
            state.timer.elapsed = state.timer.duration - state.timer.current;

            return { doRoll: doRollLoad, isFinished };
          }

          function play() {
            let isFinished = false;
            state.timer.current = getCurrent(state);

            if (state.timer.playback === Playback.Play && state._timer.finishedNow) {
              state.timer.finishedAt = state.clock;
              isFinished = true;
            } else {
              state.timer.expectedFinish = getExpectedFinish(state);
            }

            state.timer.elapsed = state.timer.duration - state.timer.current;

            return { isFinished };
          }

          // TODO: should this logic be moved up?
          // force indicates whether the state change should be broadcast to socket
          let _force = force;
          let _didUpdate = false;
          let _doRoll = false;
          let _isFinished = false;
          let _shouldNotify = false;

          const previousTime = state.clock;
          state.clock = clock.timeNow();
          const hasSkippedBack = previousTime > state.clock;

          if (hasSkippedBack) {
            _force = true;
          }

          // we call integrations if we update timers
          if (state.timer.playback === Playback.Roll) {
            const result = roll();
            _shouldNotify = true;
            _doRoll = result.doRoll;
            _isFinished = result.isFinished;
          } else if (state.timer.startedAt !== null) {
            // we only update timer if a timer has been started
            const result = play();
            _shouldNotify = true;
            _isFinished = result.isFinished;
          } else if (state.eventNow?.timerType === TimerType.TimeToEnd) {
            // or if we are in a time-to-end timer
            state.timer.current = getCurrent(state);
            state.timer.duration = state.timer.current;
          }

          // we only update the store at the updateInterval
          // side effects such as onFinish will still be triggered in the update functions
          const isTimeToUpdate = state.clock > state._timer.lastUpdate + updateInterval;
          if (_force || isTimeToUpdate) {
            state._timer.lastUpdate = state.clock;
            // TODO: can we simplify the didUpdate and shouldNotify
            _didUpdate = true;
          }

          return {
            didUpdate: _didUpdate,
            doRoll: _doRoll,
            isFinished: _isFinished,
            shouldNotify: _shouldNotify,
          };
        },
        {
          sideEffect({ didUpdate, doRoll, isFinished, shouldNotify }, newState) {
            // TODO: we cant cyclic calls to PlaybackService
            if (didUpdate && shouldNotify) {
              // TODO: can we distinguish between a clock update and a timer update?
              integrationService.dispatch(TimerLifeCycle.onUpdate);
            }

            if (doRoll) {
              runtimeService.roll();
            }

            if (isFinished) {
              integrationService.dispatch(TimerLifeCycle.onFinish);

              // handle end action if there was a timer playing
              if (newState.timer.playback === Playback.Play) {
                if (newState.eventNow.endAction === EndAction.Stop) {
                  runtimeService.stop();
                } else if (newState.eventNow.endAction === EndAction.LoadNext) {
                  // we need to delay here to put this action in the queue stack. otherwise it won't be executed properly
                  setTimeout(runtimeService.loadNext, 0);
                } else if (newState.eventNow.endAction === EndAction.PlayNext) {
                  runtimeService.startNext();
                }
              }
            }
          },
        },
      );
    },
    roll(rundown: OntimeEvent[]) {
      mutate((state) => {
        stateMutations.timer.clear();

        const { nextEvent, currentEvent } = getRollTimers(rundown, state.clock);

        if (currentEvent) {
          // there is something running, load
          state.timer.secondaryTimer = null;
          state._timer.secondaryTarget = null;

          // account for event that finishes the day after
          const endTime =
            currentEvent.timeEnd < currentEvent.timeStart ? currentEvent.timeEnd + dayInMs : currentEvent.timeEnd;

          // when we load a timer in roll, we do the same things as before
          // but also pre-populate some data as to the running state
          stateMutations.load(currentEvent, rundown, {
            startedAt: currentEvent.timeStart,
            expectedFinish: currentEvent.timeEnd,
            current: endTime - state.clock,
          });
        } else if (nextEvent) {
          // account for day after
          const nextStart = nextEvent.timeStart < state.clock ? nextEvent.timeStart + dayInMs : nextEvent.timeStart;
          // nothing now, but something coming up
          state.timer.secondaryTimer = nextStart - state.clock;
          state._timer.secondaryTarget = nextStart;
        }
        state.timer.playback = Playback.Roll;
      });
    },
  },
};

/**
 * This function is the only way to write to the state.
 * Mock this in the unit tests to assert state transitions and side effects.
 */
export function mutate<R>(
  /**
   * A pure function that receives the current state and modifies it in place.
   * The function can return a value that will be passed to the side effects, and
   * will be returned to the caller of the mutation.
   */
  fn: (state: DeepWritable<TState>) => R,
  opts?: {
    /**
     * Side effects are functions that execute code related to the change in state.
     *
     * @param result The result of the mutation function `fn`
     * @param newState The new state after the mutation
     * @param prevState The state before the mutation
     */
    sideEffect?: (result: R, newState: TState, prevState: TState) => void;
  },
) {
  const prevState = state;

  const result = fn(state as DeepWritable<TState>);

  const newState = state;

  // run action specific side effect before global side effects
  opts?.sideEffect?.(result, newState, prevState);

  // TODO: how would we handle granular updates
  // once more state is migrated here

  // set eventStore any time a mutation happens
  // this means we are pushing this data to the client every 32ms
  eventStore.batchSet({
    clock: newState.clock,
    eventNow: newState.eventNow,
    publicEventNow: newState.publicEventNow,
    eventNext: newState.eventNext,
    publicEventNext: newState.publicEventNext,
    runtime: newState.runtime,
    timer: newState.timer,
  });

  // we write to restore service if the underlying data changes
  restoreService.save({
    playback: state.timer.playback,
    selectedEventId: state.eventNow?.id ?? null,
    startedAt: state.timer.startedAt,
    addedTime: state.timer.addedTime,
    pausedAt: state._timer.pausedAt,
  });

  return result;
}
