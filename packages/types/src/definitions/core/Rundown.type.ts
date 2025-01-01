import type { DatabaseOntimeEvent, OntimeBlock, OntimeDelay, OntimeEvent } from './OntimeEvent.type.js';

export type OntimeRundownEntry = OntimeDelay | OntimeBlock | OntimeEvent;
export type DatabaseOntimeRundownEntry = OntimeDelay | OntimeBlock | DatabaseOntimeEvent;
export type OntimeRundown = OntimeRundownEntry[];
export type DatabaseOntimeRundown = DatabaseOntimeRundownEntry[];

// we need to create a manual union type since keys cannot be used in type unions
export type OntimeEntryCommonKeys = keyof OntimeEvent | keyof OntimeDelay | keyof OntimeBlock;
