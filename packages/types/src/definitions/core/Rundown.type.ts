import type { OntimeBlock, OntimeDelay, OntimeEvent, OntimeEventDAO } from './OntimeEvent.type.js';

export type OntimeRundownEntry = OntimeDelay | OntimeBlock | OntimeEvent;
export type OntimeRundown = OntimeRundownEntry[];

/**
 * This is the Data Access type for `OntimeRundownEntry`
 * and is used when a rundown is stored in the database
 */
export type OntimeRundownEntryDAO = OntimeDelay | OntimeBlock | OntimeEventDAO;
/**
 * This is the Data Access type for `OntimeRundown`
 * and is used when a rundown is stored in the database
 */
export type OntimeRundownDAO = OntimeRundownEntryDAO[];

// we need to create a manual union type since keys cannot be used in type unions
export type OntimeEntryCommonKeys = keyof OntimeEvent | keyof OntimeDelay | keyof OntimeBlock;
