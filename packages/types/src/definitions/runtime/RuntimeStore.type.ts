import { Message, TimerMessage } from './MessageControl.type.js';
import { TimerState } from './TimerState.type.js';
import { Runtime } from './Runtime.type.js';
import { OntimeEvent } from '../core/OntimeEvent.type.js';

export type RuntimeStore = {
  clock: number;

  // timer service
  timer: TimerState;

  // messages service
  timerMessage: TimerMessage;
  publicMessage: Message;
  lowerMessage: Message;
  externalMessage: Message;
  onAir: boolean;

  // event loader
  loaded: Runtime;
  eventNow: OntimeEvent | null;
  publicEventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  publicEventNext: OntimeEvent | null;
};
