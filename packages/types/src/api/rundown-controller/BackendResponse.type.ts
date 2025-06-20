import type { OntimeBlock, OntimeDelay, OntimeEvent } from '../../definitions/core/OntimeEvent.type.js';
import type { OntimeEntry } from '../../definitions/core/Rundown.type.js';

export type PatchWithId = Partial<OntimeEvent | OntimeDelay | OntimeBlock> & { id: string };
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
