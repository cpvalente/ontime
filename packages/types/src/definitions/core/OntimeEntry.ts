import type { EndAction, EntryCustomFields, MaybeNumber, TimerType, TimeStrategy, Trigger } from '../../index.js';

export type EntryId = string;

export enum SupportedEntry {
  Event = 'event',
  Delay = 'delay',
  Group = 'group',
  Milestone = 'milestone',
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

export type OntimeMilestone = OntimeBaseEvent & {
  type: SupportedEntry.Milestone;
  cue: string;
  title: string;
  note: string;
  colour: string;
  custom: EntryCustomFields;
  parent: EntryId | null;
  // !==== RUNTIME METADATA ====! //
  revision: number;
};

export type OntimeGroup = OntimeBaseEvent & {
  type: SupportedEntry.Group;
  title: string;
  note: string;
  entries: EntryId[];
  targetDuration: MaybeNumber;
  colour: string;
  custom: EntryCustomFields;
  // !==== RUNTIME METADATA ====! //
  revision: number;
  timeStart: MaybeNumber; // calculated at runtime
  timeEnd: MaybeNumber; // calculated at runtime
  duration: number; // calculated at runtime
  isFirstLinked: boolean; // calculated at runtime, whether the first event is linked
};

export type OntimeEvent = OntimeBaseEvent & {
  type: SupportedEntry.Event;
  flag: boolean;
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
  skip: boolean;
  colour: string;
  timeWarning: number;
  timeDanger: number;
  custom: EntryCustomFields;
  triggers: Trigger[];
  parent: EntryId | null;
  // !==== RUNTIME METADATA ====! //
  revision: number;
  delay: number; // calculated at runtime
  dayOffset: number; // calculated at runtime
  gap: number; // calculated at runtime
};

export type PlayableEvent = OntimeEvent & { skip: false };
export type TimeField = 'timeStart' | 'timeEnd' | 'duration';
export type OntimeEntry = OntimeDelay | OntimeGroup | OntimeEvent | OntimeMilestone;

// we need to create a manual union type since keys cannot be used in type unions
export type OntimeEntryCommonKeys = keyof OntimeEvent | keyof OntimeDelay | keyof OntimeGroup | keyof OntimeMilestone;
