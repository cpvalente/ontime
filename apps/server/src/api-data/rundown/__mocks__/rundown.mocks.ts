import { SupportedEntry, OntimeEvent, OntimeDelay, OntimeBlock, Rundown, CustomField } from 'ontime-types';

import { defaultRundown } from '../../../models/dataModel.js';

const baseEvent = {
  type: SupportedEntry.Event,
  skip: false,
  revision: 1,
};

const baseBlock = {
  type: SupportedEntry.Block,
  events: [],
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
  return { id: 'delay', type: SupportedEntry.Delay, duration: 0, ...patch } as OntimeDelay;
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

export function makeCustomField(patch: Partial<CustomField>): CustomField {
  return {
    type: 'string',
    colour: '#000000',
    label: 'Custom Field',
    ...patch,
  };
}

/**
 * Utility to generate a rundown of OntimeEvents form partial objects
 */
export function prepareTimedEvents(events: Partial<OntimeEvent>[]): OntimeEvent[] {
  return events.map(makeOntimeEvent);
}
