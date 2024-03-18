import { OntimeEvent } from './OntimeEvent.type.js';

export type PresetEvent = Omit<Partial<OntimeEvent>, 'id' | 'delay' | 'revision' | 'linkStart' | 'after' | 'type'> & {
  linkStart: boolean;
  label: string;
};

export type PresetEvents = Record<string, PresetEvent>;
