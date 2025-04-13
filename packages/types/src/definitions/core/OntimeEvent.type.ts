import type { EndAction, EventCustomFields, MaybeString, TimerType, TimeStrategy, Trigger } from '../../index.js';

export enum SupportedEvent {
  Event = 'event',
  Delay = 'delay',
  Block = 'block',
}

export type OntimeBaseEvent = {
  type: SupportedEvent;
  id: string;
};

export type OntimeDelay = OntimeBaseEvent & {
  type: SupportedEvent.Delay;
  duration: number;
};

export type OntimeBlock = OntimeBaseEvent & {
  type: SupportedEvent.Block;
  title: string;
};

export type OntimeEvent = OntimeBaseEvent & {
  type: SupportedEvent.Event;
  cue: string;
  title: string;
  note: string;
  endAction: EndAction;
  timerType: TimerType;
  countToEnd: boolean;
  linkStart: MaybeString; // ID of event to link to
  timeStrategy: TimeStrategy;
  timeStart: number;
  timeEnd: number;
  duration: number;
  isPublic: boolean;
  skip: boolean;
  colour: string;
  revision: number;
  delay: number; // calculated at runtime
  dayOffset: number; // calculated at runtime
  gap: number; // calculated at runtime
  timeWarning: number;
  timeDanger: number;
  custom: EventCustomFields;
  triggers?: Trigger[];
};

export type PlayableEvent = OntimeEvent & { skip: false };
export type TimeField = 'timeStart' | 'timeEnd' | 'duration';
