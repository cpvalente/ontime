import type { OntimeEvent, OntimeGroup } from '../core/OntimeEntry.js';
import type { SimpleTimerState } from './AuxTimer.type.js';
import type { MessageState } from './MessageControl.type.js';
import type { RundownState } from './RundownState.type.js';
import type { Offset } from './Offset.type.js';
import type { TimerState } from './TimerState.type.js';

export type RuntimeStore = {
  // timer data
  clock: number;
  timer: TimerState;

  // messages service
  message: MessageState;

  // rundown data
  rundown: RundownState;

  // runtime
  offset: Offset;

  // relevant entries
  eventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  eventFlag: OntimeEvent | null;
  groupNow: OntimeGroup | null;

  // extra timers
  auxtimer1: SimpleTimerState;
  auxtimer2: SimpleTimerState;
  auxtimer3: SimpleTimerState;

  // utils
  ping: number;
};
