import type { OntimeBlock, OntimeDelay, OntimeEvent } from '../../definitions/core/OntimeEvent.type.js';
import type { OntimeRundownEntry } from '../../definitions/core/Rundown.type.js';

type EventId = string;
export type NormalisedRundown = Record<EventId, OntimeRundownEntry>;

export interface RundownCached {
  rundown: NormalisedRundown;
  order: EventId[];
  revision: number;
}

export type PatchWithId = Partial<OntimeEvent | OntimeDelay | OntimeBlock> & { id: string };
export type EventPostPayload = Partial<OntimeRundownEntry> & {
  after?: string;
  before?: string;
};

export type TransientEventPayload = Partial<OntimeEvent | OntimeDelay | OntimeBlock> & {
  after?: string;
  before?: string;
};
