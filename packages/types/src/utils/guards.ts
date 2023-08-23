import { OntimeRundownEntry } from '../definitions/core/Rundown.type.js';
import { OntimeBlock, OntimeDelay, OntimeEvent, SupportedEvent } from '../definitions/core/OntimeEvent.type.js';

export function isOntimeEvent(event: OntimeRundownEntry): event is OntimeEvent {
  return event.type === SupportedEvent.Event;
}

export function isOntimeDelay(event: OntimeRundownEntry): event is OntimeDelay {
  return event.type === SupportedEvent.Delay;
}

export function isOntimeBlock(event: OntimeRundownEntry): event is OntimeBlock {
  return event.type === SupportedEvent.Block;
}
