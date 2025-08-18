import type { EntryId, OntimeEntry } from '../../definitions/core/OntimeEntry.js';

export type PatchWithId<T extends OntimeEntry = OntimeEntry> = Partial<T> & { id: EntryId };

export type EventPostPayload = Partial<OntimeEntry> & {
  after?: EntryId;
  before?: EntryId;
};

export type TransientEventPayload = Partial<OntimeEntry> & {
  after?: EntryId;
  before?: EntryId;
};

export type ProjectRundown = {
  id: string;
  title: string;
  numEntries: number;
  revision: number;
};

export type ProjectRundownsList = {
  loaded: string;
  rundowns: ProjectRundown[];
};
