import type { EndAction, EntryCustomFields, MaybeNumber, TimerType, TimeStrategy, Trigger } from '../../index.js';

export type EntryId = string;

export enum SupportedEvent {
  Event = 'event',
  Delay = 'delay',
  Block = 'block',
}

export type OntimeBaseEvent = {
  type: SupportedEvent;
  id: EntryId;
};

export type OntimeDelay = OntimeBaseEvent & {
  type: SupportedEvent.Delay;
  duration: number;
};

export type OntimeBlock = OntimeBaseEvent & {
  type: SupportedEvent.Block;
  title: string;
  note: string;
  events: EntryId[];
  skip: boolean;
  colour: string;
  custom: EntryCustomFields;
  // !==== RUNTIME METADATA ====! //
  revision: number;
  startTime: MaybeNumber; // calculated at runtime
  endTime: MaybeNumber; // calculated at runtime
  duration: number; // calculated at runtime
  isFirstLinked: boolean; // calculated at runtime, whether the first event is linked
  numEvents: number; // calculated at runtime
};

export type OntimeEvent = OntimeBaseEvent & {
  type: SupportedEvent.Event;
  cue: string;
  title: string;
  note: string;
  endAction: EndAction;
  timerType: TimerType;
  countToEnd: boolean;
  linkStart: boolean;
  timeStrategy: TimeStrategy;
  timeStart: number;
  timeEnd: number;
  duration: number;
  isPublic: boolean;
  skip: boolean;
  colour: string;
  timeWarning: number;
  timeDanger: number;
  custom: EntryCustomFields;
  triggers?: Trigger[];
  // !==== RUNTIME METADATA ====! //
  currentBlock: EntryId | null;
  revision: number;
  delay: number; // calculated at runtime
  dayOffset: number; // calculated at runtime
  gap: number; // calculated at runtime
};

export type PlayableEvent = OntimeEvent & { skip: false };
export type TimeField = 'timeStart' | 'timeEnd' | 'duration';
