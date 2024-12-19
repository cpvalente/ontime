import { MaybeNumber, Playback, TimerPhase, TimerType } from 'ontime-types';

// first set extends TimerState
export type ViewExtendedTimer = {
  addedTime: number;
  current: MaybeNumber;
  duration: MaybeNumber;
  elapsed: MaybeNumber;
  expectedFinish: MaybeNumber;
  finishedAt: MaybeNumber;
  phase: TimerPhase;
  playback: Playback;
  secondaryTimer: MaybeNumber;
  startedAt: MaybeNumber;

  clock: number;
  timerType: TimerType;
  countToEnd: boolean;
};
