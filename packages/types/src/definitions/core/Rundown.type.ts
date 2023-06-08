import { OntimeBlock, OntimeDelay, OntimeEvent } from './OntimeEvent.type';

export type OntimeRundownEntry = OntimeDelay | OntimeBlock | OntimeEvent;
export type OntimeRundown = OntimeRundownEntry[];

// we need to create a manual union type since keys cannot be used in type unions
export type OntimeEntryCommonKeys = keyof OntimeEvent | keyof OntimeDelay | keyof OntimeBlock;
