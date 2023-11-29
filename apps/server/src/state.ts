import { OntimeEvent, Playback, TimerState, TimerType } from 'ontime-types';
import { clock } from './services/Clock.js';
import { RestorePoint } from './services/RestoreService.js';
import { calculateDuration } from 'ontime-utils';
import { getCurrent } from './services/timerUtils.js';

type TState = {
  playback: Playback;
  readonly timer: TimerState & {
    readonly finishedNow: boolean;
  };
};

export const state: TState = {
  playback: Playback.Stop,
  timer: {
    clock: clock.timeNow(),
    current: null,
    elapsed: null,
    expectedFinish: null,
    addedTime: 0,
    startedAt: null,
    finishedAt: null,
    secondaryTimer: null,
    selectedEventId: null,
    duration: null,
    timerType: null,
    endAction: null,
    get finishedNow() {
      return this.current <= 0 && this.finishedAt === null;
    },
  },
};

export function clearTimer() {
  mutate((state) => {
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
  });
}

export function patchTimer(timer: Partial<TimerState>) {
  mutate((state) => {
    for (const key in timer) {
      if (key in state.timer) {
        state.timer[key] = timer[key];
      }
    }
  });
}

export function resumeTimer(timer: OntimeEvent, restorePoint: RestorePoint) {
  mutate((state) => {
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
}

type RequiredMutable<T> = {
  -readonly [K in keyof T]-?: NonNullable<T[K]>;
};

function mutate(fn: (state: RequiredMutable<TState>) => void) {
  const _prevState = state;

  fn(state as RequiredMutable<TState>);

  const _currentState = state;

  // eventStore.batchSet(state);
}
