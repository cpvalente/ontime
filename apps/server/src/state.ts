import type { DeepReadonly, DeepWritable } from 'ts-essentials';

import { EndAction, OntimeEvent, Playback, TimerLifeCycle, TimerState, TimerType } from 'ontime-types';
import { calculateDuration, dayInMs } from 'ontime-utils';

import { clock } from './services/Clock.js';
import { RestorePoint, restoreService } from './services/RestoreService.js';
import { getCurrent, getExpectedFinish, skippedOutOfEvent } from './services/timerUtils.js';
import { eventStore } from './stores/EventStore.js';
import { integrationService } from './services/integration-service/IntegrationService.js';
import { PlaybackService } from './services/PlaybackService.js';
import { updateRoll } from './services/rollUtils.js';

// TODO: move to timer config
const timeSkipLimit = 3 * 32;

type TState = DeepReadonly<{
  playback: Playback;
  timer: TimerState & {
    pausedTime: number;
    pausedAt: number | null;
    timeEnd: number | null;
    finishedNow: boolean;
    lastUpdate: number | null;
    secondaryTarget: number | null;
  };
}>;

export const state: TState = {
  // QUESTION: should merge playback into the timer?
  playback: Playback.Stop,
  timer: {
    clock: clock.timeNow(),
    current: null,
    elapsed: null,
    expectedFinish: null,
    addedTime: 0,
    pausedTime: 0,
    pausedAt: null,
    timeEnd: null,
    startedAt: null,
    finishedAt: null,
    secondaryTimer: null,
    selectedEventId: null,
    duration: null,
    timerType: null,
    endAction: null,
    lastUpdate: null,
    secondaryTarget: null,
    timeWarning: null,
    timeDanger: null,
    get finishedNow() {
      return this.current <= 0 && this.finishedAt === null;
    },
  },
};

export const stateMutations = {
  timer: {
    // utility to reset the state of the timer
    clear() {
      mutate((state) => {
        // TODO: check that entire state is reset here
        state.playback = Playback.Stop;
        state.timer.clock = clock.timeNow();
        state.timer.current = null;
        state.timer.elapsed = null;
        state.timer.expectedFinish = null;
        state.timer.addedTime = 0;
        state.timer.startedAt = null;
        state.timer.finishedAt = null;
        state.timer.secondaryTimer = null;
        state.timer.selectedEventId = null;
        state.timer.duration = null;
        state.timer.timerType = null;
        state.timer.endAction = null;

        state.timer.pausedTime = 0;
        state.timer.pausedAt = null;
        state.timer.secondaryTarget = null;
      });
    },
    // utility to allow modifying the state from the outside
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
          // TODO: we need an event to start, should we get the event or the whole rundown?

          state.timer.clock = clock.timeNow();
          state.timer.secondaryTimer = null;
          state.timer.secondaryTarget = null;

          // add paused time if it exists
          if (state.timer.pausedTime) {
            state.timer.addedTime += state.timer.pausedTime;
            state.timer.pausedAt = null;
            state.timer.pausedTime = 0;
          } else if (state.timer.startedAt === null) {
            state.timer.startedAt = state.timer.clock;
          }

          state.playback = Playback.Play;
          state.timer.expectedFinish = getExpectedFinish(
            state.timer.startedAt,
            state.timer.finishedAt,
            state.timer.duration,
            state.timer.pausedTime,
            state.timer.addedTime,
            state.timer.timeEnd,
            state.timer.timerType,
          );
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
          // TODO: is it easier to have a beforeAll() function that sets the timer?
          state.playback = Playback.Pause;
          state.timer.clock = clock.timeNow();
          state.timer.pausedAt = state.timer.clock;
        },
        {
          sideEffect() {
            integrationService.dispatch(TimerLifeCycle.onPause);
          },
        },
      );
    },
    resume(event: OntimeEvent, restorePoint: RestorePoint) {
      mutate((state) => {
        state.timer.clock = clock.timeNow();

        // TODO: the duplication of timer data would not be necessary
        // once event loader is merged here
        state.timer.selectedEventId = event.id;
        state.timer.startedAt = restorePoint.startedAt;
        state.timer.timeEnd = event.timeEnd;
        state.timer.duration = calculateDuration(event.timeStart, event.timeEnd);
        state.timer.current = state.timer.duration;

        state.timer.timerType = event.timerType;
        state.timer.endAction = event.endAction;

        state.playback = restorePoint.playback;
        state.timer.pausedAt = restorePoint.pausedAt;
        state.timer.addedTime = restorePoint.addedTime;

        // check if event finished meanwhile
        if (state.timer.timerType === TimerType.TimeToEnd) {
          state.timer.current = getCurrent(
            state.timer.startedAt,
            state.timer.duration,
            0,
            0,
            state.timer.clock,
            event.timeEnd,
            state.timer.timerType,
          );
        }
      });
    },
    load(event: OntimeEvent, patch?: Partial<TimerState>) {
      mutate(
        (state) => {
          // TODO: resume and load logic are very similar
          state.timer.clock = clock.timeNow();
          state.timer.selectedEventId = event.id;
          state.timer.timeEnd = event.timeEnd;

          state.playback = Playback.Armed;
          state.timer.duration = calculateDuration(event.timeStart, event.timeEnd);
          state.timer.timerType = event.timerType;
          state.timer.endAction = event.endAction;
          state.timer.timeWarning = event.timeWarning;
          state.timer.timeDanger = event.timeDanger;
          state.timer.pausedTime = 0;
          state.timer.pausedAt = 0; // TODO: should this not be null?

          state.timer.current = state.timer.duration;
          if (state.timer.timerType === TimerType.TimeToEnd) {
            state.timer.current = getCurrent(
              state.timer.clock,
              state.timer.duration,
              0,
              0,
              state.timer.clock,
              event.timeEnd,
              state.timer.timerType,
            );
          }

          if (patch) {
            state.timer = { ...state.timer, ...patch };
          }
        },
        {
          sideEffect() {
            integrationService.dispatch(TimerLifeCycle.onLoad);
          },
        },
      );
    },
    reload(timer: OntimeEvent) {
      mutate((state) => {
        state.timer.duration = calculateDuration(timer.timeStart, timer.timeEnd);
        state.timer.timerType = timer.timerType;
        state.timer.endAction = timer.endAction;
        state.timer.timeEnd = timer.timeEnd;

        state.timer.finishedAt = null;
        state.timer.expectedFinish = getExpectedFinish(
          state.timer.startedAt,
          state.timer.finishedAt,
          state.timer.duration,
          state.timer.pausedTime,
          state.timer.addedTime,
          state.timer.timeEnd,
          state.timer.timerType,
        );

        if (state.timer.startedAt === null) {
          state.timer.current = state.timer.duration;
        }
      });
    },
    addTime(amount: number) {
      mutate((state) => {
        // TODO: what kinds of validation go here or in the consumer?
        if (!state.timer.selectedEventId) {
          return;
        }

        // TODO: remove pausedTime in favour of addedTime
        state.timer.addedTime += amount;

        // handle edge cases
        const willGoNegative = amount < 0 && Math.abs(amount) > state.timer.current;
        if (willGoNegative) {
          if (state.timer.finishedAt === null) {
            state.timer.finishedAt = clock.timeNow();
          }
        } else {
          const willGoPositive = state.timer.current < 0 && state.timer.current + amount > 0;
          if (willGoPositive) {
            state.timer.finishedAt = null;
          }
        }
      });
    },
    // TODO: make options an object
    update(force: boolean, updateInterval: number) {
      return mutate(
        (state) => {
          function roll() {
            const hasSkippedOutOfEvent = skippedOutOfEvent(
              previousTime,
              state.timer.clock,
              state.timer.startedAt,
              state.timer.expectedFinish,
              timeSkipLimit,
            );
            if (hasSkippedOutOfEvent) {
              return { doRoll: true };
            }

            const tempCurrentTimer = {
              selectedEventId: state.timer.selectedEventId,
              current: state.timer.current,
              // safeguard on midnight rollover
              _finishAt:
                state.timer.expectedFinish >= state.timer.startedAt
                  ? state.timer.expectedFinish
                  : state.timer.expectedFinish + dayInMs,
              clock: state.timer.clock,
              secondaryTimer: state.timer.secondaryTimer,
              secondaryTarget: state.timer.secondaryTarget,
            };

            const updated = updateRoll(tempCurrentTimer);
            const { updatedTimer, updatedSecondaryTimer, doRollLoad, isFinished } = updated;
            state.timer.current = updatedTimer;
            state.timer.secondaryTimer = updatedSecondaryTimer;
            state.timer.elapsed = state.timer.duration - state.timer.current;

            if (isFinished) {
              state.timer.selectedEventId = null;
            }

            return { doRoll: doRollLoad, isFinished };
          }

          function play() {
            if (state.playback === Playback.Pause) {
              state.timer.pausedTime = state.timer.clock - state.timer.pausedAt;
            }

            let isFinished = false;

            if (state.playback === Playback.Play && state.timer.finishedNow) {
              state.timer.finishedAt = state.timer.clock;
              isFinished = true;
            } else {
              state.timer.expectedFinish = getExpectedFinish(
                state.timer.startedAt,
                state.timer.finishedAt,
                state.timer.duration,
                state.timer.pausedTime,
                state.timer.addedTime,
                state.timer.timeEnd,
                state.timer.timerType,
              );
            }

            state.timer.current = getCurrent(
              state.timer.startedAt,
              state.timer.duration,
              state.timer.addedTime,
              state.timer.pausedTime,
              state.timer.clock,
              state.timer.timeEnd,
              state.timer.timerType,
            );

            state.timer.elapsed = state.timer.duration - state.timer.current;

            return { isFinished };
          }

          // force indicates whether the state change should be broadcast to socket
          let _force = force;
          let _didUpdate = false;
          let _doRoll = false;
          let _isFinished = false;
          let _shouldNotify = false;

          const previousTime = state.timer.clock;
          state.timer.clock = clock.timeNow();

          if (previousTime > state.timer.clock) {
            _force = true;
          }

          // we call integrations if we update timers
          if (state.playback === Playback.Roll) {
            const result = roll();
            _shouldNotify = true;
            _doRoll = result.doRoll;
            _isFinished = result.isFinished;
          } else if (state.timer.startedAt !== null) {
            // we only update timer if a timer has been started
            const result = play();
            _shouldNotify = true;
            _isFinished = result.isFinished;
          }

          // we only update the store at the updateInterval
          // side effects such as onFinish will still be triggered in the update functions
          const isTimeToUpdate = state.timer.clock > state.timer.lastUpdate + updateInterval;
          if (_force || isTimeToUpdate) {
            state.timer.lastUpdate = state.timer.clock;
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
              PlaybackService.roll();
            }

            if (isFinished) {
              integrationService.dispatch(TimerLifeCycle.onFinish);

              // handle end action if there was a timer playing
              if (newState.playback === Playback.Play) {
                if (newState.timer.endAction === EndAction.Stop) {
                  PlaybackService.stop();
                } else if (newState.timer.endAction === EndAction.LoadNext) {
                  // we need to delay here to put this action in the queue stack. otherwise it won't be executed properly
                  setTimeout(PlaybackService.loadNext, 0);
                } else if (newState.timer.endAction === EndAction.PlayNext) {
                  PlaybackService.startNext();
                }
              }
            }
          },
        },
      );
    },
    roll(currentEvent: OntimeEvent | null, nextEvent: OntimeEvent | null) {
      mutate((state) => {
        stateMutations.timer.clear();
        // TODO: should we have a pre-action that updates time in all mutations?
        state.timer.clock = clock.timeNow();

        if (currentEvent) {
          // there is something running, load
          state.timer.secondaryTimer = null;
          state.timer.secondaryTarget = null;

          // account for event that finishes the day after
          const endTime =
            currentEvent.timeEnd < currentEvent.timeStart ? currentEvent.timeEnd + dayInMs : currentEvent.timeEnd;

          // when we load a timer in roll, we do the same things as before
          // but also pre-populate some data as to the running state
          this.load(currentEvent, {
            startedAt: currentEvent.timeStart,
            expectedFinish: currentEvent.timeEnd,
            current: endTime - state.timer.clock,
          });
        } else if (nextEvent) {
          // account for day after
          const nextStart =
            nextEvent.timeStart < state.timer.clock ? nextEvent.timeStart + dayInMs : nextEvent.timeStart;
          // nothing now, but something coming up
          state.timer.secondaryTimer = nextStart - state.timer.clock;
          state.timer.secondaryTarget = nextStart;
        }
        state.playback = Playback.Roll;
      });
    },
  },
};

/**
 * This function is the only way to write to the state.
 * Mock this in the unit tests to assert state transitions and side effects.
 */
function mutate<R>(
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
    playback: newState.playback,
    timer: newState.timer,
  });

  // we write to restore service if the underlying data changes
  restoreService.save({
    playback: state.playback,
    selectedEventId: state.timer.selectedEventId,
    startedAt: state.timer.startedAt,
    addedTime: state.timer.addedTime,
    pausedAt: state.timer.pausedAt,
  });

  return result;
}
