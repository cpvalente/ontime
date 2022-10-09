export interface OntimeBaseEvent {
  type: 'block' | 'event' | 'delay';
  id: string;
}

export interface OntimeDelay extends OntimeBaseEvent {
  type: 'delay';
  duration: number;
  revision: number;
}

export interface OntimeBlock extends OntimeBaseEvent {
  type: 'block';
}

export interface OntimeEvent extends OntimeBaseEvent {
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