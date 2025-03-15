import { SupportedEvent, OntimeEvent, OntimeDelay, OntimeBlock, Rundown } from 'ontime-types';
import { defaultRundown } from '../../../models/dataModel.js';

const baseEvent = {
  type: SupportedEvent.Event,
  skip: false,
  revision: 1,
};

const baseBlock = {
  type: SupportedEvent.Block,
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
export function makeOntimeDelay(patch: Partial<OntimeDelay>): OntimeDelay {
  return { id: 'delay', type: SupportedEvent.Delay, duration: 0, ...patch } as OntimeDelay;
}

/**
 * Utility to create a block event
 */
export function makeOntimeBlock(patch: Partial<OntimeBlock>): OntimeBlock {
  return { id: 'block', ...baseBlock, ...patch } as OntimeBlock;
}

/**
 * Utility to create a rundown object
 */
export function makeRundown(patch: Partial<Rundown>): Rundown {
  return {
    ...defaultRundown,
    ...patch,
  };
}

/**
 * Utility to generate a rundown of OntimeEvents form partial objects
 */
export function prepareTimedEvents(events: Partial<OntimeEvent>[]): OntimeEvent[] {
  return events.map(makeOntimeEvent);
}
