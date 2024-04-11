import type { OntimeRundownEntry } from '../../definitions/core/Rundown.type.js';

type EventId = string;
export type NormalisedRundown = Record<EventId, OntimeRundownEntry>;

export interface RundownCached {
  rundown: NormalisedRundown;
  order: EventId[];
  revision: number;
}
