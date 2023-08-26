import { OntimeRundownEntry } from '../definitions/core/Rundown.type.js';
import { OntimeBlock, OntimeDelay, OntimeEvent, SupportedEvent } from '../definitions/core/OntimeEvent.type.js';

type MaybeEvent = OntimeRundownEntry | null | undefined;

export function isOntimeEvent(event: MaybeEvent): event is OntimeEvent {
  return event?.type === SupportedEvent.Event;
}

export function isOntimeDelay(event: MaybeEvent): event is OntimeDelay {
  return event?.type === SupportedEvent.Delay;
}

export function isOntimeBlock(event: MaybeEvent): event is OntimeBlock {
  return event?.type === SupportedEvent.Block;
}
