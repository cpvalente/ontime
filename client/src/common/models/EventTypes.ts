export type EventTypes = 'event' | 'delay' | 'block';

export interface OntimeBaseEvent {
  type: EventTypes;
  id: string;
}

export type OntimeDelay = OntimeBaseEvent & {
  type: 'delay';
  duration: number;
  revision: number;
}

export type OntimeBlock = OntimeBaseEvent & {
  type: 'block';
}

export type OntimeEvent = OntimeBaseEvent & {
  type: 'event';
  title: string,
  subtitle: string,
  presenter: string,
  note: string,
  timeStart: number,
  timeEnd: number,
  timeType?: string,
  duration: number,
  isPublic: boolean,
  skip: boolean,
  colour: string,
  user0: string,
  user1: string,
  user2: string,
  user3: string,
  user4: string,
  user5: string,
  user6: string,
  user7: string,
  user8: string,
  user9: string,
  revision: number,
}

export type OntimeEventEntry = OntimeDelay | OntimeBlock | OntimeEvent;