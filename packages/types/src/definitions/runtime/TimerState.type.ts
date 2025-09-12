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

/**
 * Gathers the current running timer state
 */
export type TimerState = {
  /** Additional time added to the running timer, can be negative */
  addedTime: number;
  /** Current running timer countdown */
  current: MaybeNumber;
  /** Total duration of the running event */
  duration: MaybeNumber;
  /** Time elapsed since the timer started */
  elapsed: MaybeNumber;
  /** Timestamp of the expected finish time */
  expectedFinish: MaybeNumber;
  /** Current phase of the running event */
  phase: TimerPhase;
  /** Timer's playback state */
  playback: Playback;
  /** Secondary timer, used to count to an event start in roll mode */
  secondaryTimer: MaybeNumber;
  /** Timestamp when the timer started */
  startedAt: MaybeNumber;
};
