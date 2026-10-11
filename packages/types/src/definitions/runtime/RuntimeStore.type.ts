import type { OntimeEvent, OntimeGroup } from '../core/OntimeEntry.js';
import type { SimpleTimerState } from './AuxTimer.type.js';
import type { MessageState } from './MessageControl.type.js';
import type { Offset } from './Offset.type.js';
import type { RundownState } from './RundownState.type.js';
import type { TeleprompterState, TeleprompterSync } from './Teleprompter.type.js';
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

  // the teleprompter shared by controllers and the screens following them, as people and integrations read it
  teleprompter: TeleprompterState;
  // what screens following the shared teleprompter animate from, internal to Ontime
  teleprompterSync: TeleprompterSync;

  // utils
  ping: number;
};
