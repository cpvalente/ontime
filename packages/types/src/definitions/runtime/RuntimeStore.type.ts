import { MaybeString } from '../../utils/utils.type.js';
import type { OntimeEvent } from '../core/OntimeEntry.js';
import type { SimpleTimerState } from './AuxTimer.type.js';
import type { BlockState } from './CurrentBlockState.type.js';
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
  eventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;

  blockNow: BlockState | null;
  blockNext: MaybeString;

  // extra timers
  auxtimer1: SimpleTimerState;
  auxtimer2: SimpleTimerState;
  auxtimer3: SimpleTimerState;

  // utils
  ping: number;
};
