import { EndAction, OntimeEvent, Playback, TimerLifeCycle, TimerState, TimerType } from 'ontime-types';
import { clock } from './services/Clock.js';
import { RestorePoint, restoreService } from './services/RestoreService.js';
import { calculateDuration, dayInMs } from 'ontime-utils';
import { getCurrent, getExpectedFinish } from './services/timerUtils.js';
import type { DeepReadonly, DeepWritable } from 'ts-essentials';
import { eventStore } from './stores/EventStore.js';
import { integrationService } from './services/integration-service/IntegrationService.js';
import { PlaybackService } from './services/PlaybackService.js';
import { updateRoll } from './services/rollUtils.js';

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
    get finishedNow() {
      return this.current <= 0 && this.finishedAt === null;
    },
  },
};

export const stateMutations = {
  timer: {
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
    stop(shouldNotify = false) {
      mutate(
        (state) => {
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
        },
        {
          sideEffect() {
            if (shouldNotify) {
              integrationService.dispatch(TimerLifeCycle.onStop);
            }
          },
        },
      );
    },
    pause() {
      mutate(
        (state) => {
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
    resume(timer: OntimeEvent, restorePoint: RestorePoint) {
      mutate((state) => {
        state.timer.selectedEventId = timer.id;
        state.timer.timeEnd = timer.timeEnd;
        state.timer.pausedAt = restorePoint.pausedAt;

        state.timer.duration = calculateDuration(timer.timeStart, timer.timeEnd);
        state.playback = restorePoint.playback;
        state.timer.timerType = timer.timerType;
        state.timer.endAction = timer.endAction;
        state.timer.startedAt = restorePoint.startedAt;
        state.timer.addedTime = restorePoint.addedTime;
        state.timer.current = state.timer.duration;

        if (state.timer.timerType === TimerType.TimeToEnd) {
          const now = clock.timeNow();
          state.timer.current = getCurrent(now, state.timer.duration, 0, 0, now, timer.timeEnd, state.timer.timerType);
        }
      });
    },
    load(timer: OntimeEvent) {
      mutate(
        (state) => {
          state.timer.selectedEventId = timer.id;
          state.timer.timeEnd = timer.timeEnd;

          state.playback = Playback.Armed;
          state.timer.duration = calculateDuration(timer.timeStart, timer.timeEnd);
          state.timer.timerType = timer.timerType;
          state.timer.endAction = timer.endAction;
          state.timer.pausedTime = 0;
          state.timer.pausedAt = 0;

          state.timer.current = state.timer.duration;
          if (state.timer.timerType === TimerType.TimeToEnd) {
            const now = clock.timeNow();
            state.timer.current = getCurrent(
              now,
              state.timer.duration,
              0,
              0,
              now,
              timer.timeEnd,
              state.timer.timerType,
            );
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
        if (!state.timer.selectedEventId) {
          return;
        }

        state.timer.addedTime += amount;

        // handle edge cases
        if (amount < 0 && Math.abs(amount) > state.timer.current) {
          if (state.timer.finishedAt === null) {
            // if we will make the clock negative
            state.timer.finishedAt = clock.timeNow();
          }
        } else if (state.timer.current < 0 && state.timer.current + amount > 0) {
          // clock will go from negative to positive
          state.timer.finishedAt = null;
        }
      });
    },
    update(force: boolean, updateInterval: number) {
      return mutate(
        (state) => {
          function roll() {
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

            const { updatedTimer, updatedSecondaryTimer, doRollLoad, isFinished } = updateRoll(tempCurrentTimer);

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
          if (_force || state.timer.clock > state.timer.lastUpdate + updateInterval) {
            state.timer.lastUpdate = state.timer.clock;
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
            if (didUpdate && shouldNotify) {
              integrationService.dispatch(TimerLifeCycle.onUpdate);
            }

            if (doRoll) {
              PlaybackService.roll();
            }

            if (isFinished) {
              integrationService.dispatch(TimerLifeCycle.onFinish);
              if (newState.playback === Playback.Play) {
                if (newState.timer.endAction === EndAction.Stop) {
                  PlaybackService.stop();
                } else if (newState.timer.endAction === EndAction.LoadNext) {
                  // we need to delay here to put this action in the queue stack. otherwise it won't be executed properly
                  setTimeout(() => {
                    PlaybackService.loadNext();
                  }, 0);
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
 * This function is the only way to write to the state. You should mock this
 * function on the unit tests to assert state transitions and side effects.
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

  opts?.sideEffect?.(result, newState, prevState);

  try {
    eventStore.batchSet({
      playback: newState.playback,
      timer: newState.timer,
    });
  } catch (error) {
    const shouldSwallow =
      error instanceof Error && error.message === "Cannot access 'eventStore' before initialization";

    if (!shouldSwallow) {
      throw error;
    }
  }

  restoreService.save({
    playback: state.playback,
    selectedEventId: state.timer.selectedEventId,
    startedAt: state.timer.startedAt,
    addedTime: state.timer.addedTime,
    pausedAt: state.timer.pausedAt,
  });

  return result;
}
