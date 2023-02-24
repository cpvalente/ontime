import { OntimeBlock, OntimeDelay, OntimeEvent } from './OntimeEvent.type';

export type OntimeRundownEntry = OntimeDelay | OntimeBlock | OntimeEvent;
export type OntimeRundown = OntimeRundownEntry[];
