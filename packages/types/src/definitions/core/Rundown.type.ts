import type { EntryId, OntimeEntry } from './OntimeEntry.js';

export type RundownEntries = Record<EntryId, OntimeEntry>;

type RundownId = string;
export type ProjectRundowns = Record<RundownId, Rundown>;

export type Rundown = {
  id: string;
  title: string;
  order: EntryId[];
  flatOrder: EntryId[];
  entries: RundownEntries;
  revision: number;
};
