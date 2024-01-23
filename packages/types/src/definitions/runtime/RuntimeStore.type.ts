import { MessageState } from './MessageControl.type.js';
import { TimerState } from './TimerState.type.js';
import { Runtime } from './Runtime.type.js';
import { OntimeEvent } from '../core/OntimeEvent.type.js';

export type RuntimeStore = {
  clock: number;

  // timer service
  timer: TimerState;

  // messages service
  message: MessageState;
  onAir: boolean;

  // event loader
  loaded: Runtime;
  eventNow: OntimeEvent | null;
  publicEventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  publicEventNext: OntimeEvent | null;
};
