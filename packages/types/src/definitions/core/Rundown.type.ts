import type { OntimeBlock, OntimeDelay, OntimeEvent, OntimeEventDAO } from './OntimeEvent.type.js';

/** Combination of events available to consumers */
export type OntimeRundownEntry = OntimeDelay | OntimeBlock | OntimeEvent;
/** Combination of events that can be persisted */
export type OntimeRundownEntryDAO = OntimeDelay | OntimeBlock | OntimeEventDAO;

/** Rundown exposed to consumes */
export type OntimeRundown = OntimeRundownEntry[];
/** Rundown exposed to persistence */
export type OntimeRundownDAO = OntimeRundownEntryDAO[];

// we need to create a manual union type since keys cannot be used in type unions
export type OntimeEntryCommonKeys = keyof OntimeEvent | keyof OntimeDelay | keyof OntimeBlock;
