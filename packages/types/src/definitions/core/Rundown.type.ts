import type { EntryId, OntimeBlock, OntimeDelay, OntimeEvent } from './OntimeEvent.type.js';

export type OntimeEntry = OntimeDelay | OntimeBlock | OntimeEvent;
export type RundownEntries = Record<EntryId, OntimeEntry>;

// we need to create a manual union type since keys cannot be used in type unions
export type OntimeEntryCommonKeys = keyof OntimeEvent | keyof OntimeDelay | keyof OntimeBlock;

export type ProjectRundowns = Record<string, Rundown>;

export type Rundown = {
  id: string;
  title: string;
  order: EntryId[];
  entries: RundownEntries;
  revision: number;
};
