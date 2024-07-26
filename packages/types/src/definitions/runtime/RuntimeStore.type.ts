import type { OntimeEvent } from '../core/OntimeEvent.type.js';
import type { DrivenTimerState, SimpleTimerState } from './AuxTimer.type.js';
import type { CurrentBlockState } from './CurrentBlockState.type.js';
import type { MessageState } from './MessageControl.type.js';
import type { Runtime } from './Runtime.type.js';
import type { TimerState } from './TimerState.type.js';

export type RuntimeStore = {
  // timer data
  clock: number;
  timer: TimerState;
  onAir: boolean;

  // messages service
  message: MessageState;

  // rundown data
  runtime: Runtime;
  currentBlock: CurrentBlockState;
  eventNow: OntimeEvent | null;
  publicEventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  publicEventNext: OntimeEvent | null;

  // extra timers
  auxtimer1: SimpleTimerState;
  auxtimer2: DrivenTimerState;

  // flags
  frozen: boolean;
};
