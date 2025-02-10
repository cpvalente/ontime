import type { MaybeNumber } from '../../index.js';
import type { Playback } from './Playback.type.js';

export enum TimerPhase {
  None = 'none',
  Default = 'default',
  Warning = 'warning',
  Danger = 'danger',
  Overtime = 'overtime',
  /** used for waiting to roll */
  Pending = 'pending',
}

export type TimerState = {
  /** time added by user, can be negative */
  addedTime: number;
  /** running countdown */
  current: MaybeNumber;
  /** normalised duration of current event */
  duration: MaybeNumber;
  /** elapsed time in current timer */
  elapsed: MaybeNumber;
  /** time we expect timer to finish */
  expectedFinish: MaybeNumber;
  /** only if timer has already finished */
  finishedAt: MaybeNumber;
  phase: TimerPhase;
  playback: Playback;
  /** used for roll mode */
  secondaryTimer: MaybeNumber;
  /** only if timer has already started */
  startedAt: MaybeNumber;
  /** the speed of the current timer 1.0 = realtime, 2.0 = double time */
  speed: number;
};
