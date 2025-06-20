import { SupportedEvent, OntimeEvent, OntimeDelay } from 'ontime-types';

const baseEvent = {
  type: SupportedEvent.Event,
  skip: false,
  revision: 1,
};

/**
 * Utility to create a Ontime event
 */
export function makeOntimeEvent(patch: Partial<OntimeEvent>): OntimeEvent {
  return {
    ...baseEvent,
    ...patch,
  } as OntimeEvent;
}

/**
 * Utility to create a delay event
 */
export function makeOntimeDelay(duration: number): OntimeDelay {
  return { id: 'delay', type: SupportedEvent.Delay, duration };
}

/**
 * Utility to generate a rundown of OntimeEvents form partial objects
 */
export function prepareTimedEvents(events: Partial<OntimeEvent>[]): OntimeEvent[] {
  return events.map(makeOntimeEvent);
}
