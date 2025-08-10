import type { MaybeString } from '../../utils/utils.type.js';
import type { OntimeEvent } from '../core/OntimeEntry.js';
import type { SimpleTimerState } from './AuxTimer.type.js';
import type { GroupState, UpcomingEntry } from './CurrentGroupState.type.js';
import type { MessageState } from './MessageControl.type.js';
import type { Runtime } from './Runtime.type.js';
import type { TimerState } from './TimerState.type.js';

export type RuntimeStore = {
  // timer data
  clock: number;
  timer: TimerState;

  // messages service
  message: MessageState;

  // rundown data
  runtime: Runtime;
  eventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;

  groupNow: GroupState | null;
  groupNext: MaybeString;
  nextFlag: UpcomingEntry | null;

  // extra timers
  auxtimer1: SimpleTimerState;
  auxtimer2: SimpleTimerState;
  auxtimer3: SimpleTimerState;

  // utils
  ping: number;
};
