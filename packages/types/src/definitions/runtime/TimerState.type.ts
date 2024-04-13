import type { MaybeNumber } from '../../index.js';
import type { Playback } from './Playback.type.js';

export type TimerState = {
  addedTime: number; // time added by user, can be negative
  current: MaybeNumber; // running countdown
  duration: MaybeNumber; // normalised duration of current event
  elapsed: MaybeNumber; // elapsed time in current timer
  expectedFinish: MaybeNumber; // time we expect timer to finish
  finishedAt: MaybeNumber; // only if timer has already finished
  playback: Playback;
  secondaryTimer: MaybeNumber; // used for roll mode
  startedAt: MaybeNumber; // only if timer has already started
};
