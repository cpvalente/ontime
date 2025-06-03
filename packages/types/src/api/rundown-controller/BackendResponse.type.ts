import type { OntimeEntry } from '../../definitions/core/Rundown.type.js';

export type PatchWithId<T extends OntimeEntry = OntimeEntry> = Partial<T> & { id: string };

export type EventPostPayload = Partial<OntimeEntry> & {
  after?: string;
  before?: string;
};

export type TransientEventPayload = Partial<OntimeEntry> & {
  after?: string;
  before?: string;
};

export type ProjectRundownsList = {
  id: string;
  title: string;
  numEntries: number;
  revision: number;
}[];
