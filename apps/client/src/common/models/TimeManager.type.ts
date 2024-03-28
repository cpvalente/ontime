import { MaybeNumber, Playback, TimerType } from 'ontime-types';

// first set extends TimerState
export type ViewExtendedTimer = {
  addedTime: number;
  current: MaybeNumber;
  duration: MaybeNumber;
  elapsed: MaybeNumber;
  expectedFinish: MaybeNumber;
  finishedAt: MaybeNumber;
  playback: Playback;
  secondaryTimer: MaybeNumber;
  startedAt: MaybeNumber;

  clock: number;
  timeDanger: MaybeNumber;
  timeWarning: MaybeNumber;
  timerType: TimerType;
};
