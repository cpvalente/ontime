import type { MaybeNumber } from '../../utils/utils.type.js';
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
 * Timer for the running group, present when the group opted into a shared timer.
 *
 * The group is treated as a single event containing all its children: the values are
 * derived from the running event timer plus the content scheduled around it, so pause,
 * added time, overtime and roll are inherited from the event timer rather than recalculated.
 */
export type GroupTimerState = {
  /** Time remaining in the group */
  current: number;
  /** Time elapsed since the group started */
  elapsed: number;
  /** Total time in the group, includes time added to the running event */
  duration: number;
};

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
  /** Active time elapsed since the timer started */
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
