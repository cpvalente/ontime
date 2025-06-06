import type { EndAction, EntryCustomFields, MaybeNumber, TimerType, TimeStrategy, Trigger } from '../../index.js';

export type EntryId = string;

export enum SupportedEntry {
  Event = 'event',
  Delay = 'delay',
  Block = 'block',
}

export type OntimeBaseEvent = {
  type: SupportedEntry;
  id: EntryId;
};

export type OntimeDelay = OntimeBaseEvent & {
  type: SupportedEntry.Delay;
  duration: number;
  parent: EntryId | null;
};

export type OntimeBlock = OntimeBaseEvent & {
  type: SupportedEntry.Block;
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
};

export type OntimeEvent = OntimeBaseEvent & {
  type: SupportedEntry.Event;
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
  parent: EntryId | null;
  // !==== RUNTIME METADATA ====! //
  revision: number;
  delay: number; // calculated at runtime
  dayOffset: number; // calculated at runtime
  gap: number; // calculated at runtime
};

export type PlayableEvent = OntimeEvent & { skip: false };
export type TimeField = 'timeStart' | 'timeEnd' | 'duration';
