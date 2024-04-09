import type { EndAction, EventCustomFields, MaybeString, TimerType, TimeStrategy } from '../../index.js';

export enum SupportedEvent {
  Event = 'event',
  Delay = 'delay',
  Block = 'block',
}

export type OntimeBaseEvent = {
  type: SupportedEvent;
  id: string;
  after?: string; // used when creating an event to indicate its position in rundown
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
  linkStart: MaybeString; // ID of event to link to
  timeStrategy: TimeStrategy;
  timeStart: number;
  timeEnd: number;
  duration: number;
  isPublic: boolean;
  skip: boolean;
  colour: string;
  revision: number;
  delay?: number; // calculated at runtime
  timeWarning: number;
  timeDanger: number;
  custom: EventCustomFields;
};
