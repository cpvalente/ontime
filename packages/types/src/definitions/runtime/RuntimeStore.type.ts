import { Playback } from './Playback.type.js';
import { MessageState } from './MessageControl.type.js';
import { TimerState } from './TimerState.type.js';
import { Runtime } from './Runtime.type.js';
import { OntimeEvent } from '../core/OntimeEvent.type.js';
import { SimpleTimerState } from './ExtraTimer.type.js';

export type RuntimeStore = {
  // timer service
  timer: TimerState;
  playback: Playback;

  // messages service
  message: MessageState;
  onAir: boolean;

  // event loader
  loaded: Runtime;
  eventNow: OntimeEvent | null;
  publicEventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  publicEventNext: OntimeEvent | null;

  // extra timers
  timer1: SimpleTimerState;
};
