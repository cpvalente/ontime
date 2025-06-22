import { OntimeEvent } from 'ontime-types';

export type Subscribed = { id: string; label: string; colour: string; value: string }[];
export type TitleFields = Pick<OntimeEvent, 'title'>;
export type EditEvent = Pick<OntimeEvent, 'id' | 'cue'> & { subscriptions: Subscribed };
