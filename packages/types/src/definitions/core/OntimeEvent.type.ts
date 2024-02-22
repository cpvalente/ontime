import { MaybeString } from '../../index.js';
import { EndAction } from '../EndAction.type.js';
import { TimerType } from '../TimerType.type.js';
import { TimeStrategy } from '../TimeStrategy.type.js';

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

export type CustomPropertyLabel = string;
export type CustomPropertyDefinition = Record<
  CustomPropertyLabel,
  {
    label: CustomPropertyLabel;
    type: 'string' | 'number' | 'boolean';
  }
>;

export type EventCustomProperties = Record<
  CustomPropertyLabel,
  {
    value: string | number | boolean;
  }
>;

export type OntimeEvent = OntimeBaseEvent & {
  type: SupportedEvent.Event;
  cue: string;
  title: string;
  subtitle: string;
  presenter: string;
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
  user0: string;
  user1: string;
  user2: string;
  user3: string;
  user4: string;
  user5: string;
  user6: string;
  user7: string;
  user8: string;
  user9: string;
  revision: number;
  delay?: number; // calculated at runtime
  timeWarning: number;
  timeDanger: number;
  custom: EventCustomProperties;
};
