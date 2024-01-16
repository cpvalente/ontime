import { TimerType } from '../TimerType.type.js';
import { EndAction } from '../EndAction.type.js';

export type TimerState = {
  current: number | null; // running countdown
  elapsed: number | null; // elapsed time in current timer
  expectedFinish: number | null;
  addedTime: number; // time added by user, can be negative
  startedAt: number | null;
  finishedAt: number | null; // only if timer has already finished
  secondaryTimer: number | null; // used for roll mode
  duration: number | null;
  timerType: TimerType | null;
  endAction: EndAction | null;
  timeWarning: number | null;
  timeDanger: number | null;
};
