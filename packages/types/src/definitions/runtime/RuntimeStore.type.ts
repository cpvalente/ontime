import { MessageState } from './MessageControl.type.js';
import { TimerState } from './TimerState.type.js';
import { Runtime } from './Runtime.type.js';
import { OntimeEvent } from '../core/OntimeEvent.type.js';
import { SimpleTimerState } from './ExtraTimer.type.js';

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
  publicEventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  publicEventNext: OntimeEvent | null;

  // extra timers
  timer1: SimpleTimerState;

  //client list lives here for now
  clientList: [];
};
