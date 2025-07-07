import type { OntimeEntry } from '../../definitions/core/OntimeEntry.js';

export type PatchWithId<T extends OntimeEntry = OntimeEntry> = Partial<T> & { id: string };

export type EventPostPayload = Partial<OntimeEntry> & {
  after?: string;
  before?: string;
};

export type TransientEventPayload = Partial<OntimeEntry> & {
  after?: string;
  before?: string;
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
